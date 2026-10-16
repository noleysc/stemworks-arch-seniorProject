# Dashboard read model

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

The dashboard answers four questions a founder already has when they sit down:

1. Where is the money moving? Confirmed and Potential, across the ventures in view.
2. What is next? The upcoming milestone, event, or deadline.
3. What needs attention today? Alerts that require a person.
4. How are the ventures performing? Which are active, and which are quiet.

Time on this screen is organized by milestone and event. It is not a week or month calendar. The screen is forward-looking. Closed deals and past events stay in the venture detail. The dashboard does not show follower counts, page views, or social engagement. It does not show raw tables. Full tables live in the branch that owns them. It does not repeat notification streams from Craftybase, Square, or Shopify. Those products notify their own users. Stemworks alerts on founder action and on patterns that cross ventures.

How the numbers are produced is in [modules.md](modules.md). Who may see them is in [security.md](security.md).

## Layout

One screen, four zones. On a phone they stack in this order, so the operational picture is readable in a few seconds:

1. Command header
2. Attention rail
3. Venture cards, the expanded card first
4. Milestone timeline, scrolling horizontally

On a wide screen the four zones are visible together. The header does not scroll away.

Filtering to one venture is the same screen. The header, the rail, the cards, and the timeline all honor the filter. "All ventures" clears it. This is not a second application.

## Zone 1 — command header

Two figures dominate, both integer cents rendered as money:

- **Confirmed.** Revenue committed, converted, or contracted. Bankable.
- **Potential.** Confirmed plus the full value of active deals in motion. Honest about what is open. Not a forecast, and not a capacity times a price.

The gap between them is the execution target and stays visible.

Supporting elements:

- The single next milestone across the ventures in view, with a countdown to `due_at`.
- One line for the highest-priority open alert, when one exists. No alert means the line is absent, not a placeholder.
- A venture switcher. Choosing a venture sets the filter.

Phase 1 renders Confirmed and Potential only. Predicted is not reserved as a blank third number. It appears when `intelligence` is allowed to speak, and it arrives with a confidence label. Until then the header does not hint that a prediction exists.

### How the header adds

The composer asks each enabled module for `confirmedCents` and `potentialCents` on the ventures in view, and sums the cents. It does not average them and it does not convert through floating point.

In the first build the only contributors are `product` and `atelier` on Jade Flowers:

- Product confirmed is the net of orders in `processing`, `shipped`, or `delivered`.
- Product potential adds pending orders.
- Atelier confirmed is deposits collected, including forfeited no-show deposits.
- Atelier potential adds the ticket price of registrations that exist and have not yet paid.
- Unsold seats, unlisted catalog, and rent are not part of either number.

The other ventures contribute zero until their module is enabled. A hand-entered milestone still appears in the header's "next milestone" slot, because milestones live in the kernel and do not require a module.

## Zone 2 — venture cards

One card per venture. None are hidden.

Expanded when `hasCurrentActivity` is true: name, color token, confirmed, potential, next milestone and countdown, the top three pipeline items from that venture's modules, branch status, and a link to the venture detail. Collapsed when the venture is quiet: name, color, status label, last activity date, and a control to expand.

Sort is by activity, most recent first. A pin (`pinned_at`) overrides sort and does not change whether the card is expanded. The founder can expand a collapsed card without pinning it.

Day-one seed, which is data, not a hardcoded layout:

| Venture | Why the card looks this way on day one |
| --- | --- |
| Jade Flowers | Expanded once product or atelier activity exists. Status label "Active revenue". |
| Jade Experiences | Expanded because a hand-entered Voices & Visions Vol. 3 milestone counts as current activity. Pipeline items are an empty list until Event Production is on. Status label "Event production active". |
| Jade Haven | Collapsed. Status label "Pre-revenue · Development phase". |
| Stemworks | Collapsed. Status label "Pre-revenue · Validation phase". |

An expanded card with an empty pipeline shows the empty state in words ("No deals in motion") and still shows milestones and branch status. It does not show a sample deal.

Top three items are whatever the module's `topItems` port returns. The dashboard does not rank rows itself and does not join `orders` to `talent_engagement`.

## Zone 3 — attention rail

Open `attention_items` for the ventures in view, newest first. Types and the kind of sentence they carry:

| Type | Example |
| --- | --- |
| `inventory_low` | Rose & Vetiver stock below reorder threshold |
| `pipeline_stalled` | Nadia — no touchpoint in 14 days |
| `contract_unsigned` | Wholesale agreement pending — Ley |
| `event_milestone_due` | V&V Vol. 3 — talent contracts due in 3 days |
| `branch_sync_error` | Craftybase last synced 26 hours ago |
| `capital_milestone` | Jade Haven — LOI review due this week |

Dismiss archives the row and records who archived it. The log view lists archived items. There is no delete.

In the first build, inventory alerts are published by `product` when a balance crosses its reorder point. The other types are created by hand, or by a module once that module exists. Sync-error alerts appear when an adapter exists and a sync fails. Until then the rail does not invent a stale-sync message.

## Zone 4 — milestone timeline

A horizontal timeline of `open` milestones whose `due_at` falls inside the horizon. Default horizon is 90 days forward. The founder can expand it to 12 months. Color is the venture's `color_token`.

Kinds that appear, once something publishes them:

- Event dates (an atelier session, a Voices & Visions volume, a pop-up)
- Pipeline deadlines (follow-up, contract end)
- Inventory reorder points
- Lease and property milestones (LOI, negotiation, signing, build-out)
- Capstone and development milestones (schema lock, build sprints, demo day)

Completed and cancelled milestones are excluded here. They remain on the venture.

## Venture filter

The filter is a `subsidiary_id` query parameter on the dashboard routes. The server checks it against the caller's allowed subsidiaries after authentication.

- The owner may filter to any venture in the tenant, or to all of them.
- A manager may filter only to their own subsidiary. Another id is 404. The all-ventures view for a manager is that one subsidiary, not the parent.
- An associate does not receive pipeline cents or P&L. If an associate opens the dashboard, the header and card money are omitted and the financial routes behind them are 403. Operational milestones and non-financial alerts still render. The first build has only an owner, and the associate behavior is tested before an associate account exists.
- A client and a platform admin do not get this screen.

The header's totals, the rail, and the timeline all use the same allowed set. Filtering is not done by hiding cards in the browser after a payload of every venture was sent.

## Branch status

Reached from a card and from a global branches view. Columns: branch, type, status, last sync. The payload is the `branches` row. It never includes `branch_secrets`.

Native branches report `active` and no sync time, and the UI reads that as live. Integration branches the venture does not have connected report `not_connected`. A connect action for an adapter that is not in this build returns 404 with a clear message, not a half-built OAuth redirect.

First-build native rows on Jade Flowers: Product operations, Atelier, and Pipeline CRM. Pipeline CRM is the pipeline port. It is not a second CRM and it is not Salesforce. Salesforce, HoneyBook, HubSpot, Craftybase, Square, Shopify, and Eventbrite appear only as integration rows, and only as `not_connected` until that adapter is built.

## Reads the dashboard adds

These routes are not in the technical spec's endpoint list. They exist because this screen does. They follow the same auth, tenancy, and cursor rules.

- `GET /api/v1/dashboard?subsidiary_id=` — header totals, next milestone, top alert, and the cards.
- `GET /api/v1/dashboard/attention?subsidiary_id=&status=open|archived`
- `GET /api/v1/dashboard/milestones?subsidiary_id=&horizon=90d|12m`
- `GET /api/v1/branches?subsidiary_id=`
- `POST /api/v1/alerts/:id/dismiss` — archive. The founder must be allowed to see the venture the alert belongs to.

Dismiss of an alert outside the caller's set is 404.

## What the first build shows in the first glance

1. Confirmed and Potential for Jade Flowers, summed from orders and atelier deposits, plus zeros from the other ventures.
2. The next milestone, which may be the seeded Voices & Visions milestone or a Jade Flowers date, whichever is sooner.
3. The top open alert, if the founder or the inventory rule has created one.
4. Jade Flowers and Jade Experiences present as active cards. Jade Haven and Stemworks present as quiet cards. Empty pipelines say they are empty.

## What the screen refuses to show

- A Predicted figure, a confidence badge, or a deal-health flag, until `intelligence` is on for that founder.
- Vanity metrics.
- Closed history, except through the venture detail.
- Raw data tables.
- Remote notifications copied from Craftybase, Square, or Shopify.
- Another tenant's totals, or another subsidiary's totals for a manager.
- Sample numbers shipped as a default. Empty is an empty state.
