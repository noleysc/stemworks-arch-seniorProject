# Spec gaps and recorded decisions

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Places where the technical specification's prose, its field lists, and the other two documents do not line up, and the decision this architecture records so two implementers do not resolve them differently. None of these decisions add a product the sources did not ask for. They close holes that would otherwise ship as inconsistent tables or as a security control that does not actually hold.

The overview is in [README.md](README.md). The resulting model is in [modules.md](modules.md) and [security.md](security.md).

## 1. `tenant_id` on every table

Section 4 says all tables include a `tenant_id` foreign key. The field lists for child tables omit it: `user_roles`, `materials`, `material_purchases`, `inventory_levels`, `batches`, `batch_materials`, `skus`, `sku_batch_lineage`, `customers`, `orders`, `order_line_items`, `events`, `event_registrations`.

**Decision.** Every tenant-owned table has `tenant_id`, denormalized, including child rows. Row-level security predicates on that column directly. A policy that only joins through a parent is not used. New kernel tables (`inventory_movements`, `refresh_tokens`, `audit_events`, `attention_items`, `milestones`, `branches`, `branch_secrets`, `sync_inbox`, `idempotency_keys`, `subsidiary_modules`) follow the same rule.

## 2. Defect reason

User story 04 requires a defect reason when QC is logged. The `batches` field list has units passed, units rejected, and yield, and no reason.

**Decision.** `batches.defect_reason` is text, nullable, written on the QC update that sets `units_passed_qc`. Associates cannot perform that update.

## 3. Refresh tokens cannot be stateless

Section 7 calls JWT stateless. Section 6 requires logout to invalidate the refresh token, and requires refresh to accept that token. A token the server does not store cannot be invalidated.

**Decision.** The access token stays a short-lived stateless JWT (15 minutes). The refresh token is random, stored as a hash in `refresh_tokens`, rotated on use, and revoked on logout. Reuse of a revoked refresh token revokes the chain. The browser receives the refresh token only as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to the auth routes. Section 6.1 says login returns both tokens. This architecture returns the access token in JSON and the refresh token in the cookie, so page scripts cannot read the long-lived credential. Implementers do not "correct" this back to a JSON refresh token.

## 4. Inventory is a ledger plus a balance

The spec describes `inventory_levels.quantity_on_hand` as a column updated automatically on batch save and on purchase receipt. A single mutable number cannot be rebuilt, cannot explain a discrepancy, and cannot be denied `UPDATE` without blocking legitimate receipts.

**Decision.** `inventory_movements` is the source of truth and is append-only for the application role. `inventory_levels` remains the balance the API reads, unique on `material_id`, and is updated only in the same transaction as a movement, under a row lock. The same pattern applies to finished-goods `units_on_hand` and `units_allocated`. Corrections are reversing movements.

## 5. The application role is not the table owner

The spec requires row-level security and does not mention that PostgreSQL skips those policies for the table owner and for any role with `BYPASSRLS`, including superusers.

**Decision.** Three roles. `stemworks_migrator` owns the tables and is used only by migrations. `stemworks_app` runs the API, with `NOBYPASSRLS`. `stemworks_platform` is reserved and can read only the tenant health view. Every tenant table is created with `ENABLE` and `FORCE ROW LEVEL SECURITY`. The API refuses to start if it is connected as the migrator or as a superuser. Tenant context is `set_config(name, value, true)` inside the request transaction. A session-level `SET` is forbidden because a pooled connection would keep the previous tenant.

## 6. Missing tenant context is an error, not an empty list

A policy that fails to see `app.tenant_id` matches zero rows. A handler bug would then look like "this founder has no batches."

**Decision.** Middleware returns 500 when the setting was not applied. The policy also denies rows. Tests assert cross-tenant isolation with the app role at the database, not only through the HTTP `WHERE` clause.

## 7. Subsidiary type `event_production`

The spec's `subsidiaries.type` enum is `product_brand | wellness_hospitality | software`. The dashboard's day-one ventures include Jade Experiences, the cultural series, which is neither a product brand nor Haven nor the software venture.

**Decision.** Add `event_production` and `boutique_hotel`. Jade Experiences uses the first. Luminary's three ventures use the second. Module enablement is still `subsidiary_modules`, so the type does not secretly turn modules on. Prefixes: `LHR`, `LHD`, and `LHG` for Luminary Rooms, Dining, and Gatherings. `JF`, `JE`, `JH`, and `SW` stay the Diaz Ventures ventures. `DV` stays the Diaz parent prefix and is not stamped on a venture.

## 8. One role per subsidiary, and different roles across subsidiaries

The spec says both. They are compatible, and the schema has to say so.

**Decision.** Unique (`user_id`, `subsidiary_id`) on subsidiary-scoped role rows. A separate partial unique index allows a single `owner` per tenant, with `subsidiary_id` null. A person may be a manager in one venture and an associate in another. The owner row spans the tenant and is not combined with a second role row for that same user.

## 9. Email uniqueness

The spec says email is unique per tenant and does not show the constraint.

**Decision.** Unique (`tenant_id`, `email`).

## 10. FIFO cost, because "actual cost at production time" was not given a formula

`cost_per_unit_cents` is described as `total_cost / quantity_received`. User story 17 says COGS reflects the actual cost at the time of production. A single latest purchase price mis-states older stock still on the shelf. A moving average hides which receipt was consumed. The spec does not choose.

**Decision.** FIFO. `material_purchases.quantity_remaining` draws down oldest receipts first. The batch line stores the blended cost of the lots actually consumed, and `total_cost_cents` is the sum of those lot costs, so rounding cannot create or lose cents on the batch. Purchase `cost_per_unit_cents` is `ROUND(total_cost_cents / quantity_received)` for the receipt record, half away from zero, via PostgreSQL `ROUND` on `numeric`. Finished goods allocate the oldest released lineage first, and the order line stores that blend. The client does not send COGS. Floats are not used.

## 11. Yield and other computed money fields have one definition

The spec marks yield, units rejected, net amount, line margin, and event net profit as computed, and does not say whether the writer is the application, a generated column, or both.

**Decision.** One SQL function per figure, called by the service that writes the row. Generated columns are acceptable when they have no division-by-zero problem. Yield is null when `units_poured` is zero, not zero and not an error. The dashboard and the API do not each implement their own formula.

## 12. Batch codes need a real sequence

A code of the form `JF-C-2026-0420-001` built by counting existing rows races under two concurrent creates and can collide.

**Decision.** A per-subsidiary, per-day sequence is allocated inside the batch-create transaction, and the code column is unique per tenant. The same rule applies to order codes and event codes.

## 13. Order endpoints

The schema defines `orders` and `order_line_items`. Section 6 stops before order routes. Sales attribution and channel margin depend on those rows.

**Decision.** `GET/POST /orders` and `GET/PATCH /orders/:id` follow the same authentication, tenancy, cents, and cursor rules as the rest of `/api/v1`. COGS on a line is server-written from lineage. This is the spec's tables, exposed, not a new ordering product.

## 14. Dashboard routes

Section 6 does not list the dashboard. The dashboard specification requires the screen.

**Decision.** Add `GET /dashboard`, `GET /dashboard/attention`, `GET /dashboard/milestones`, `GET /branches`, and `POST /alerts/:id/dismiss`. They are a read model over kernel primitives and module ports. They are not a new system of record.

## 15. Associate "create only" against `PATCH /batches/:id`

The endpoint list allows patch. The permission matrix says an associate may create a batch record and may not edit it. User story 06 is about logging a batch from a phone, which is create.

**Decision.** The matrix wins. Associate `PATCH /batches/:id` is 403, including QC. The create response omits cost fields.

## 16. Phase numbers

The sources schedule the same work differently.

| Topic | Technical spec | Dashboard spec | Decision |
| --- | --- | --- | --- |
| Hospitality / Jade Haven | Phase 3 | Full pipeline called Phase 2 | Own module, for Jade Haven only. Not the Luminary build. |
| Luminary Hotel & Co. | Not in the technical spec. The client definitions exclude established hotels with a PMS. | Not in the dashboard's day-one ventures. | Founder decision: the first build is this hotel. The module is `hotel`, not `hospitality`, and it does not replace Marriott. Recorded in section 23. |
| Predictive layer | Phase 3 | Phase 2, after 6 or more months of founder data | `intelligence` stays dark until that tenant's history meets a written minimum. No industry averages. No predicted occupancy for Luminary in the first build. |
| Integrations | Phase 1 non-goal | Capstone track alongside the core, Craftybase and Square and Shopify | Connect port and status rows may exist. Adapter code is not part of the core build. Luminary's future feeds are a rooms projection and an outlet sales projection, not Craftybase. |
| Multi-tenant licensing | Architecture ready in Phase 1, product in Phase 4 | Platform admin is later | `tenant_id`, row-level security, and `plan_tier` exist from the first migration. Provisioning, billing, and the admin UI do not. |

## 17. "Pipeline CRM" as a native branch

The dashboard's branch table lists Pipeline CRM as a native branch that is always live, next to Salesforce and HoneyBook as integrations that are not connected.

**Decision.** `native:pipeline` is the pipeline port composed by the dashboard. It is always live because it does not sync. Wholesale accounts, talent engagements, capital partners, and corporate clients stay in their own modules. There is no global `deals` table built to satisfy this row.

## 18. Candle Atelier is not the cultural series

The technical spec's event tables and user stories 20 through 23 describe a ticketed session with a deposit and a cost-bucket P&L. The client definitions describe a recurring series whose roster, run-of-show, and venue carry from one volume to the next.

**Decision.** Two modules, `atelier` and `event-production`. Neither is the first build. The first build's ticketed sessions are The Workshop and the other Luminary gatherings, owned by `hotel`. Candle Atelier is implemented when Jade Flowers is built. Event Production is specified in [modules.md](modules.md). Post-event purchase columns exist on the atelier registration because the spec defines them. The conversion report (user story 24) waits.

## 19. Idempotency of inventory writes

The spec requires inventory to deduct on batch save and to increase on purchase receipt. It does not mention retries.

**Decision.** An idempotency key is required on every create that posts money. In the first build that is the daily flash, deal create, and session registration. Batch create, purchase receipt, and atelier registration follow the same rule when those modules are built. The key is unique per tenant. The same key and the same body return the stored response and do not post a second movement. The same key and a different body return 409.

## 20. Personal data and health data

The spec stores email and phone in the clear and encrypts them at rest in the phase that introduces Haven client data. It leaves HIPAA as an open question. The dashboard and the client definitions still need contacts.

**Decision.** Email and phone stay unencrypted until that later phase, and they are still banned from logs. No health, diagnosis, or clinical column is created. If counsel says Haven holds health records, those records go in a separate classified store. They are not added to hospitality tables. Integration secrets are encrypted immediately, because they are credentials, not the personal-data deferral.

## 21. Access-token role snapshot

A role change that only took effect after the database was re-read on every call would be stricter than a 15-minute snapshot. The snapshot is what a stateless access token can honestly claim.

**Decision.** The access token carries the role snapshot. `is_active` is read from the database on every request, so deactivation is immediate. Role changes revoke refresh tokens. A demoted user's access token can still be used until it expires, and no longer than 15 minutes. Tests cover deactivation. They also document the demotion window so it is not treated as an accidental hole later.

## 22. Money display versus storage

The dashboard talks about pipeline value as money a founder reads. The API returns cents.

**Decision.** Storage, API, and sums are integer cents. Formatting to dollars happens in the web app at the edge. The header adds cents, then formats once.

## 23. The first build is Luminary Hotel & Co.

The technical spec's first build is Jade Flowers: batches, inventory, COGS, and the Candle Atelier, live before May 2026. The client definitions say the hospitality module is for an emerging wellness founder and is not for an established boutique hotel that already has a property management system, and not for a franchise operator. Luminary Hotel & Co. is an operating 243-room Autograph Collection hotel managed by Mainsail Lodging & Development, on Marriott Bonvoy, at 2200 Edwards Drive, Fort Myers.

**Decision.** The founder moved the first build to this hotel. That decision does not rewrite the client definition into a lie. Stemworks does not become the property management system, does not take payment cards, and does not import guest profiles. The module built first is `hotel`, specified in [luminary.md](luminary.md). Jade Haven's `hospitality` module stays the pre-open wellness contract and is not enabled on the Luminary tenant. Jade Flowers moves to a later build on the Diaz Ventures tenant. The two tenants do not share rows.

## 24. Business date versus UTC

The technical spec stores timestamps in UTC. A hotel's business date is the date the property assigns, in `America/New_York`, and it often closes after midnight.

**Decision.** Instants stay `timestamptz` UTC. Flashes, group arrival and departure, and session dates are a `date` plus the property timezone. The server does not derive the business date by truncating UTC.

## 25. Square footage that the public pages do not agree on

The Marriott overview describes the Caloosa Sound Convention Center as 40,000 square feet. The 2026 fact sheet describes a 30,000 square foot Caloosa Sound Ballroom and a combined campus of more than 149,000 square feet. The amphitheater is 93,080 square feet in the fact sheet. The hotel's own function space is 10,000 square feet in both.

**Decision.** Store each venue with the figure and the source named in [luminary.md](luminary.md). Do not collapse them into one integer, and do not store the combined marketing total as a capacity.
