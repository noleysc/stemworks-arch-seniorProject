# Modules, aggregates, and ports

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

How the kernel and the modules divide the system. The overview and the phase gates are in [README.md](README.md). Security controls that every module sits on are in [security.md](security.md).

## Dependency rule

A module exports three things: its route handlers, its domain types, and a `ports.ts` the dashboard is allowed to call. Everything else stays in `internal/`.

Allowed:

- Import types and functions from `packages/kernel`.
- Read and write only the tables that module owns, inside the request transaction the kernel opened.
- Publish a milestone or an attention item by calling the kernel port.
- Read the current tenant, user, and allowed subsidiaries from the kernel context.

Forbidden:

- Import another module.
- Call another module's Prisma delegate, or name another module's tables in SQL.
- Insert into `attention_items`, `milestones`, or `audit_events` directly.
- Return `password_hash`, refresh-token material, or `branch_secrets` ciphertext to any caller.

The dashboard imports ports. It does not import `internal/`. `intelligence` reads facts modules have already published. It does not reach into their tables. Connect adapters write the sync inbox. The owning module's projector is the only writer of domain rows that come from an integration.

A request that targets a module not enabled for that venture returns 404 before the handler runs. Enablement is `subsidiary_modules`, not a guess from `subsidiaries.type`.

## Kernel aggregates

The kernel owns identity, tenancy, shared timeline primitives, and the pipeline shape. It does not own candles, talent, leases, or predictions.

### Tenancy and people

`tenants`

- `id`, `name`, `plan_tier` (`internal | starter | professional | enterprise`), `is_active`, `created_at`

`subsidiaries` (ventures)

- `id`, `tenant_id`, `name`, `type` (`product_brand | event_production | wellness_hospitality | boutique_hotel | software`), `prefix_code`, `color_token`, `status_label`, `pinned_at`, `created_at`
- Sort for the dashboard is by latest activity, with pinned ventures first. Activity is the most recent domain write or manual milestone for that venture, exposed through the activity port. Pin overrides sort only. It does not force a card open.
- A card is expanded when the venture has current activity and collapsed when it does not. The founder can expand a collapsed card. The card is never hidden.

`subsidiary_modules`

- `subsidiary_id`, `tenant_id`, `module_key`, `enabled_at`
- `module_key`: `hotel | product | atelier | event-production | hospitality | intelligence | connect`
- Unique on (`subsidiary_id`, `module_key`)

`users`

- `id`, `tenant_id`, `email`, `full_name`, `password_hash`, `is_active`, `created_at`, `last_login_at`
- Unique (`tenant_id`, `email`)

`user_roles`

- `id`, `tenant_id`, `user_id`, `subsidiary_id`, `role`, `assigned_at`, `assigned_by`
- `role`: `owner | manager | associate | client | platform_admin`
- Unique (`user_id`, `subsidiary_id`) for subsidiary-scoped rows
- Partial unique index: one `owner` per tenant, and that row has `subsidiary_id` null
- A platform admin has no subsidiary role and no policy that returns operational rows

### Milestones

`milestones`

- `id`, `tenant_id`, `subsidiary_id`, `module_key` (null when entered by hand), `kind`, `title`, `due_at`, `source` (`manual | module`), `status` (`open | done | cancelled`)
- `kind`: `event_date | pipeline_deadline | inventory_reorder | lease_property | capstone_development`
- Color on the timeline comes from the venture's `color_token`, not from the milestone
- The dashboard shows `open` milestones inside the requested horizon. Done and cancelled stay in the venture detail.

### Attention

`attention_items`

- `id`, `tenant_id`, `subsidiary_id`, `module_key`, `type`, `body`, `status` (`open | archived`), `created_at`, `archived_at`, `archived_by`
- `type`: `inventory_low | pipeline_stalled | contract_unsigned | event_milestone_due | branch_sync_error | capital_milestone`
- Dismiss sets `archived`. Rows are not deleted. The log view reads `archived`.

### Idempotency

`idempotency_keys`

- `tenant_id`, `key`, `request_hash`, `response_status`, `response_body`, `created_at`
- Unique (`tenant_id`, `key`)
- Same key and same hash returns the stored response. Same key and a different hash returns 409.
- Required on the first-build money creates: flash upsert, `POST /deals`, and `POST /sessions/:id/registrations`. When `product` and `atelier` are built, the same rule covers `POST /batches`, `POST /materials/:id/purchases`, and `POST /events/:id/registrations`.

## Ports

These are the only calls the dashboard makes into a module. Amounts are integer cents. An unimplemented module is not called: the composer skips a module that is off for that venture and contributes zeros, an empty item list, and no native branch beyond the rows already stored.

```ts
type PipelineItem = {
  label: string;
  stage: string;
  valueCents: number;
  kind: string;
};

interface PipelinePort {
  confirmedCents(subsidiaryId: string): number;
  potentialCents(subsidiaryId: string): number;
  topItems(subsidiaryId: string, limit: 3): PipelineItem[];
}

interface ActivityPort {
  lastActivityAt(subsidiaryId: string): Date | null;
  statusLabel(subsidiaryId: string): string;
  hasCurrentActivity(subsidiaryId: string): boolean;
}

interface MilestoneSource {
  // Modules publish through the kernel. The dashboard reads the kernel table.
  // This source exists so a module can describe the milestones it owns.
}

interface BranchStatus {
  key: string;
  label: string;
  kind: "native" | "integration";
  status: "connected" | "not_connected" | "error" | "active";
  lastSyncedAt: Date | null;
}
```

Kernel ports a module may call:

- `attention.publish(item)` and `attention.archive(id)`
- `milestones.publish(milestone)` and `milestones.complete(id)`
- `audit.record(event)` — the service layer calls this; handlers do not write the table
- `money` helpers for cents arithmetic and formatting
- `tenancy.context()` for the tenant, user, and allowed subsidiaries

Confirmed and Potential mean the same thing on every port. Confirmed is money that is committed, converted, or already collected. Potential is confirmed plus the value of deals that are actually in motion. Capacity that nobody has claimed is not potential. A cost (rent, talent fees, materials) is not pipeline revenue.

## Enablement

The first tenant is Luminary Hotel & Co. The Diaz Ventures ventures are a different tenant and are not seeded beside the hotel.

| Venture | Tenant | Type | Modules on in the first build | Later |
| --- | --- | --- | --- | --- |
| Luminary Rooms | Luminary | `boutique_hotel` | `hotel` | Rooms projection, read-only, counts and cents |
| Luminary Dining | Luminary | `boutique_hotel` | `hotel` | Outlet sales projection, net sales and covers |
| Luminary Gatherings | Luminary | `boutique_hotel` | `hotel` | Public-show talent carry-forward only if `event-production` is later enabled |
| Jade Flowers | Diaz Ventures | `product_brand` | `product` (materials, SKUs, orders) | `atelier`, batches / lineage |
| Jade Experiences | Diaz Ventures | `event_production` | none | `event-production` |
| Jade Haven | Diaz Ventures | `wellness_hospitality` | none | `hospitality` |
| Stemworks | Diaz Ventures | `software` | none | Its own commercial pipeline, manual milestones until a module is justified |

Luminary day-one seed, with no sample money:

- Luminary Rooms — prefix `LHR`, status label "243 keys · operational".
- Luminary Dining — prefix `LHD`, status label "Outlets operational". The outlet catalog is seeded from [luminary.md](luminary.md). Flashes are not.
- Luminary Gatherings — prefix `LHG`, status label "Meetings, Workshop, convention center, amphitheater". Venues are seeded. Deals and sessions are not.

Diaz Ventures seed, used only when that tenant is created:

- Jade Flowers — prefix `JF`, status label "Active revenue".
- Jade Experiences — prefix `JE`, status label "Event production active".
- Jade Haven — prefix `JH`, status label "Pre-revenue · Development phase".
- Stemworks — prefix `SW`, status label "Pre-revenue · Validation phase".

`DV` is reserved for Diaz parent identifiers. It is not stamped on Luminary rows.

## `hotel`

First build. Luminary Hotel & Co. only, on that tenant's three ventures. The property, the outlets, the venues, the flash, the deals, and the sessions are specified in [luminary.md](luminary.md). This module does not import `atelier`, `product`, or `hospitality`. Workshop sessions use the session-and-cost-bucket shape, and the tables are `hotel`'s.

Routes, confirmed and potential, and the Marriott boundary are in that document. The idempotent writes for this module are the daily flash, deal create, and session registration.

## `product`

Specified for Jade Flowers. Not the first build. Small-batch production, inventory, orders, and the money that falls out of them. The behavior below is what this module implements when it is built. It is not part of the Luminary pilot.

### Aggregates and tables

Owned tables, each with `tenant_id` plus the columns from the technical spec:

- `materials` — catalog. Category, unit of measure, supplier, supplier SKU, reorder point, lead time, `is_active`. Scoped by `subsidiary_id`.
- `material_purchases` — one row per receipt. `quantity_received`, `total_cost_cents`, `cost_per_unit_cents`, supplier order reference. Also `quantity_remaining`, so consumption can draw down specific receipts.
- `inventory_movements` — append-only ledger. Kind is `purchase_receipt | batch_consumption | qc_release | order_allocation | order_shipment | order_release`. Signed quantity. Reference to the purchase, batch, or order that caused it. `inventory_levels.quantity_on_hand` is the balance, unique per material, updated in the same transaction. Nothing else writes the balance.
- `batches` — one pour session. Human code `{prefix}-C-{YYYYMMDD}-{seq}`, sequence allocated per subsidiary per day inside the transaction so two creates cannot take the same code. Status path: `in_production → curing → qc_review → released → archived`. `units_rejected = units_poured - units_passed_qc`. Yield is `(units_passed_qc / units_poured) * 100` as `decimal(5,2)`, and null when poured is zero. `defect_reason` is written with the QC result (the user story requires it; the field list omitted it).
- `batch_materials` — one row per material on a batch. `quantity_used`, snapshotted `cost_per_unit_cents`, `total_cost_cents`.
- `skus` — finished catalog. Retail, wholesale, and event prices in cents. `units_on_hand`, `units_allocated`. Available to sell is on-hand minus allocated, computed on read, not stored as a writable column.
- `sku_batch_lineage` — units of a SKU added from a batch, with `cogs_per_unit_cents` snapshotted at QC release (`batch material cost / units_passed_qc`).
- `customers` — `retail | wholesale | event_attendee | corporate_client`. Email list status and referral source as specified.
- `orders` and `order_line_items` — code `{prefix}-ORD-{year}-{seq}`, allocated the same way as batch codes. Channel `ecommerce | wholesale | event | consignment | direct`. Status `pending | processing | shipped | delivered | refunded | cancelled`. Line price, snapshotted COGS, line total, and line margin are cents. `attributed_to` is the associate, when there is one.

### Cost rule

FIFO on material receipts. Consuming a batch draws the oldest `material_purchases` rows that still have `quantity_remaining`. The batch line stores one blended `cost_per_unit_cents` for what was actually consumed, and `total_cost_cents` as the sum of those lot costs. Rounding of a per-unit snapshot is half away from zero to the nearest cent (`ROUND` on `numeric` in PostgreSQL). The line total is the sum of the lot costs, so rounding does not invent or lose cents on the batch. Finished goods use the same idea: an order allocates the oldest released lineage first, and the line's `cogs_per_unit_cents` is the blend of the units allocated. Selling price never changes historical COGS.

`cost_per_unit_cents` on a purchase is `ROUND(total_cost_cents / quantity_received)` for display and for the purchase record. Batch costing uses the lot totals above, not a second division.

### What the numbers mean

- Confirmed: `net_amount_cents` of orders in `processing`, `shipped`, or `delivered`. Refunded and cancelled orders contribute nothing. Pending orders are not confirmed.
- Potential: confirmed, plus `net_amount_cents` of `pending` orders. There is no quote object in this module. Unsold catalog is not potential.
- Top three items: the open orders or wholesale commitments with the nearest deadline or the largest value, returned through the pipeline port. The module decides the ordering; the dashboard does not query `orders`.

### Behavior this module implements when it is built

- Creating a batch generates the code, writes the lines, posts consumption movements, and lowers `quantity_remaining` and `quantity_on_hand`, in one transaction. Insufficient stock rolls the transaction back.
- QC writes units passed, units rejected, and `defect_reason`, and moves status. Release posts finished-goods movements and lineage, and raises `units_on_hand` on the SKU.
- A purchase receipt posts a receipt movement, increases on-hand, and stores the cost snapshot.
- Reorder alerts: a material at or below `reorder_point` publishes `inventory_low` through the kernel. Clearing back above the point does not delete the alert; the founder archives it, or a later rule archives it when stock recovers. Recovery archival can wait until this module is built.
- Batches remaining for a material is computed from on-hand and average consumption per batch. It is not stored.
- Margin reads: per SKU, at retail, wholesale, and event price, using the current lineage COGS. Rolling subsidiary P&L by month, quarter, or year. Channel breakdown of revenue and margin. Consolidated P&L is owner-only and sums subsidiaries inside the caller's tenant. It does not sum Luminary into Jade Flowers. The handler rejects any subsidiary outside the tenant, and rejects non-owners.
- Associates may `POST` a batch and may not `PATCH` it. They do not receive cost or margin fields. See [security.md](security.md).

### Routes

From the technical spec, under `/api/v1`:

- `GET/POST /batches`, `GET/PATCH /batches/:id`, `GET /batches/:id/materials`, `GET /batches/:id/financials`
- `GET/POST /materials`, `GET /materials/:id`, `POST /materials/:id/purchases`, `GET /inventory/alerts`
- `GET /skus`, `GET /skus/:id/lineage`
- `GET /financials/margins`, `GET /financials/pl`, `GET /financials/pl/consolidated`, `GET /financials/channel-breakdown`

Order routes are required by the order tables and by sales attribution, and the spec's endpoint list stopped before them. They follow the same rules:

- `GET/POST /orders`, `GET/PATCH /orders/:id`
- Amount fields on create are cents. COGS is filled by the server from lineage. The client does not send COGS.

## `atelier`

Specified for a product-brand venture. Not the first build, and not used by Luminary. The Workshop at the hotel is a `hotel` session. This module is the Candle Atelier.

### Aggregates

- `events` — code `{prefix}-EVT-{year}-{seq}`. Type `candle_atelier | wellness_retreat | vendor_spotlight | creative_platform | other`. When this module is built it uses `candle_atelier`. A `creative_platform` value is still an atelier session: one date, one capacity, one deposit. It does not become a series, and it does not grow talent, tiers, or a run-of-show. Those belong to `event-production`. Capacity, `ticket_price_cents`, `deposit_amount_cents`, schedule, location, status `draft | open | full | completed | cancelled`. Cost buckets: `hospitality_cost_cents`, `materials_cost_cents`, `overhead_cost_cents`. `net_profit_cents` is revenue minus those costs, computed and stored when the event is completed. It is not a number someone types in.
- `event_registrations` — status `registered | deposit_paid | confirmed | attended | no_show | cancelled`. Deposit amount and `deposit_paid_at`. `checked_in_at`. `post_event_purchase` and `post_event_purchase_amount_cents` exist because the spec defines the columns. The conversion report that reads them is later (user story 24).

Atelier does not store a talent roster, a run-of-show, ticket tiers, or a content archive.

### What the numbers mean

- Confirmed: deposits actually collected on registrations in `deposit_paid`, `confirmed`, `attended`, or `no_show`. A no-show's forfeited deposit is collected money and stays in confirmed. Cancelled registrations contribute nothing.
- Potential: confirmed, plus `ticket_price_cents` times registrations in `registered` that have not paid. Unsold seats are not a deal in motion and are not potential. Capacity remains on the event record as an operational number.
- Session P&L, on the event detail, not on the dashboard: collected ticket and deposit revenue, minus the three cost buckets, minus refunds. Break-even attendance is computed from ticket price and total cost. No-shows are counted separately from attended guests.

Where the deposit is charged (Stemworks, Eventbrite, or Stripe) is an open decision. Whatever the source, the registration stores the amount and the timestamp. Eventbrite, when it is connected later, projects ticket counts through Connect into this module or into Event Production, depending on which module owns the event. It does not become the system of record for the P&L.

### Routes

- `GET/POST /events`, `GET /events/:id`, `GET /events/:id/pl`
- `POST /events/:id/registrations`, `PATCH /events/:id/registrations/:reg_id`

Associates may view an event and may check a guest in (`attended` or `no_show`, plus `checked_in_at`). They do not receive cost buckets, net profit, or break-even.

## `event-production`

Contract. Not built in the first phase. Enabled later on Jade Experiences only. Jade Flowers does not enable it.

Creating the next edition is a domain operation that copies the previous edition forward. The founder edits the copy. They do not rebuild a tracker from an empty page.

### Aggregates

- `series` — the recurring show. Name, home venue reference, default capacity.
- `edition` — one volume. Number, date, status, venue, capacity, link to `copied_from_edition_id`. Voices & Visions Vol. 3 is an edition, not a new series.
- `talent_engagement` — person, role, contract status (`inquiry | pending | confirmed | declined | historical`), fee in cents, terms, performance notes. Copying an edition copies engagements forward as the starting roster, including people who are historical, so the next volume opens with memory rather than a blank list. A declined or historical row stays attached to the edition it belonged to.
- `run_of_show` — ordered segments, plus notes. The template and the notes copy forward. The new edition inherits last volume's script and then diverges.
- `venue_record` — capacity, setup requirements, relationship notes. Copied forward with the edition.
- `ticket_tier` — `early_bird | general_admission | door`. Price in cents, quantity sold, quantity available. Sold counts update from native entry or, later, from an Eventbrite projection. Revenue is visible against capacity before the doors open.
- `edition_pnl` — door revenue minus talent, venue, and production, in cents. The edition can be closed so the founder sees the result within a day. Lines are snapshotted. They are not a live formula over editable history.
- `content_asset` — one archived asset per edition. Kind, storage reference, captured-at. This is the structured archive, not a link to three camera rolls.

### What the numbers mean

- Confirmed: ticket revenue collected across tiers.
- Potential: confirmed, plus the value of holds or unpaid invoices that are actual deals in motion. Unsold capacity is shown on the edition as capacity. It is not added to potential.
- Top items: open talent contracts and the nearest production deadline, as pipeline items. A talent fee is a cost. It can appear as an attention item (`contract_unsigned`) and as a milestone. It is not added to potential revenue.

Carry-forward copies roster, run-of-show, notes, and venue. It does not copy last edition's ticket sales, P&L, or content assets. Those stay with the edition that earned them.

## `hospitality`

Contract for Jade Haven. Not the Luminary build. Luminary is an operating Autograph hotel and uses `hotel`. This module is the pre-open wellness pipeline. It does not reuse `orders`, `batches`, talent tables, or the Luminary flash.

### Aggregates

- `property` — one first property. Lease terms, landlord and other contacts, build-out milestones, mode `pre_open | operational`.
- `capital_partner` — investor, lender, or grant. Stage from `interested` through `funded`. A silence threshold, in days, stored on the row. When the last touch is older than the threshold and the stage is not `funded` or `passed`, the module publishes `pipeline_stalled` or `capital_milestone` through the kernel.
- `corporate_account` — a corporate wellness client. Proposal stage, contract terms, invoice status, repeat booking cadence. A stall at "interested" publishes an attention item. This is not a HubSpot replica. HubSpot or Salesforce, if connected later, project into these rows through Connect.
- `rent_to_revenue_signal` — rent in cents, projected revenue in cents, and the threshold ratio stored per property. When rent over projected revenue crosses the threshold, the module publishes an attention item. Projected revenue is an explicit input on the property. It is not silently replaced with Potential from the pipeline port. Rent is a cost signal, not pipeline value.
- Milestones across the lease, the capital raise, the build-out, and the client pipeline, published to the kernel as `lease_property` or `pipeline_deadline`.

Transition to `operational` archives the capital and development pipeline (partners and build-out milestones move to an archived state). It does not delete them. The operational record — lease obligations, corporate accounts, rent-to-revenue — stays current.

No clinical or health fields exist on these tables. Contacts store the name, role, and the communication details the spec already allows elsewhere. If an attorney later decides Haven holds health records, those records go in a classified store with its own access rules. They are not columns added to `property` or `corporate_account`. The client portal and membership billing are not this module.

### What the numbers mean

- Confirmed: capital in `funded`, plus the contract value of corporate accounts that are signed.
- Potential: confirmed, plus capital that is in an active stage and not yet funded, plus corporate proposals that are in motion.
- A quiet partner is an attention item, not a silent deletion from potential, until the founder marks the partner passed.

## `intelligence`

Dormant. No tables are written and no third number is rendered until a documented minimum of that founder's own history exists. Six months is the dashboard spec's bar; the module stays dark below whatever minimum is written down when it is built.

It subscribes to facts the other modules already store: stage changes, ticket sales by day, wholesale outcomes, seasonal totals, time spent in a stage. It emits, through the dashboard:

- Predicted, beside Confirmed and Potential, in cents, with a confidence indicator.
- Deal health when a deal is older than this founder's own close window for that stage.
- An event revenue projection from this founder's ticket velocity.
- A reorder hint before on-hand crosses `reorder_point`.

A low-confidence figure is shown and labeled. It is not dropped, and it is not presented as Confirmed. The model is per founder. Another tenant's rows are never part of the fit. Training reads go through an explicit export inside the tenant, not through a cross-tenant query.

## `connect`

The port exists so adapters can be added without the dashboard or the domain modules importing them. The first build stores branch rows and serves the status panel. It does not include adapter code. `POST` to connect an integration returns 404 until that adapter is part of the build.

### Tables

`branches`

- `id`, `tenant_id`, `subsidiary_id`, `key`, `label`, `kind` (`native | integration`), `status` (`connected | not_connected | error | active`), `last_synced_at`, `last_error`
- Unique (`subsidiary_id`, `key`)
- `last_error` is a short code and a safe message. It must not contain a credential, a query string, or a response body from the remote system.

`branch_secrets`

- `branch_id`, `tenant_id`, `ciphertext`, `nonce`, `key_version`
- AES-GCM. The key comes from the environment. The status API never joins this table into a client response.

`sync_inbox`

- `id`, `tenant_id`, `branch_id`, `received_at`, `fact_type`, `payload`, `projected_at`
- Adapters insert here. The owning module's projector consumes unprojected rows and writes its own tables. The projector is idempotent on the inbox id.

### Native rows

Always `active`, `last_synced_at` null, displayed as live:

| Key | Label | Present from |
| --- | --- | --- |
| `native:hotel-rooms` | Rooms | First build, Luminary Rooms |
| `native:hotel-dining` | Dining | First build, Luminary Dining |
| `native:hotel-gatherings` | Gatherings | First build, Luminary Gatherings |
| `native:pipeline` | Pipeline CRM | First build, every venture. This is the pipeline port, not a CRM database. |
| `native:product` | Product operations | When `product` is enabled |
| `native:atelier` | Atelier | When `atelier` is enabled |
| `native:event-production` | Event Production | When that module is enabled |
| `native:hospitality` | Hospitality Pipeline | When that module is enabled |

### Integration keys

Created as `not_connected` when a venture is allowed to use them. No secrets until connect succeeds.

Luminary, created as `not_connected` in the first build: `integration:rooms-pms`, `integration:outlet-pos`. What they are allowed to project is in [luminary.md](luminary.md). A payload with a guest name, a Bonvoy identifier, a folio line, or a card is rejected and not stored.

Later Diaz Ventures adapters: `integration:craftybase`, `integration:square`, `integration:shopify`, `integration:eventbrite`, `integration:honeybook`, `integration:hubspot`, `integration:salesforce`.

Craftybase and Square are the product-module adapters: stock levels into the product ledger, and transactions into confirmed revenue. They are not Luminary's point of sale. Shopify follows the same projector pattern. Eventbrite feeds ticket counts into `event-production` or `atelier`, chosen by which module owns the event, and does not replace the P&L. HoneyBook, HubSpot, and Salesforce feed hospitality or product pipeline items. None of them are queried by the dashboard directly.

### Connector

```text
BranchConnector
  connect(credentials) -> stores a secret, sets status connected
  disconnect()         -> deletes the secret, sets status not_connected
  sync()               -> writes sync_inbox, updates last_synced_at or last_error
  status()             -> the branches row, with no secret fields
```

A sync failure sets `error` and publishes `branch_sync_error` ("Craftybase last synced 26 hours ago" is the shape of the copy). Recovering sync sets `connected` and leaves the old alert for the founder to archive, so the log keeps the failure.

## Module checklist for a new table

Before a table is added:

1. It has an owning module. Shared timeline and identity tables stay in the kernel.
2. It has `tenant_id`, a primary key UUID, and UTC timestamps.
3. Money columns are integer cents. The name ends in `_cents`.
4. A row-level security policy and `FORCE ROW LEVEL SECURITY` ship in the same migration.
5. If the row is financial or an inventory quantity, the write is append-only or snapshotted, and the mutation is audited.
6. The dashboard learns about it through a port, or not at all.
