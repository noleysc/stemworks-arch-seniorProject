# First build — Luminary Hotel & Co.

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

The first build of Stemworks is the operating record for [Luminary Hotel & Co., Autograph Collection](https://www.marriott.com/en-us/hotels/rswak-luminary-hotel-and-co-autograph-collection/overview/), 2200 Edwards Drive, Fort Myers, Florida 33901. Marriott property code `RSWAK`. This page is the property contract. The kernel, the dashboard, and the security model do not change to fit it. What changes is which module is built first, and which tenant that module runs in.

Public facts below come from the hotel's Marriott overview and from the hotel's 2026 fact sheet. Where those two disagree, both figures are stored and the source is named. Nothing else about the operation is invented.

## What this property is

Luminary is an operating AAA Four Diamond boutique hotel, twelve stories on the Caloosahatchee, the area's first Autograph Collection hotel. It is managed by Mainsail Lodging & Development. It participates in Marriott Bonvoy. It has 243 guest rooms and suites. Check-in is 4:00 p.m. and check-out is 11:00 a.m., local time, and the minimum age to check in is 21. Pets are not allowed. The property is smoke-free. On-site self parking is $1 an hour or $25 a day. Valet is $35 a day.

It is not a pre-open lease. It is not a spa. It is not Jade Haven. The wellness hospitality module — lease, capital partners, corporate wellness accounts, rent-to-revenue, `pre_open` moving to `operational` — stays the contract for Jade Haven and is not enabled here. Turning Luminary into that pipeline would describe a hotel that is already open as if it were still raising money to open.

It is also not a property management system. Room inventory, reservations, rates, Bonvoy profiles, mobile keys, folios, and payment authorization stay in Marriott's systems, in whatever property-management system the hotel already runs. This architecture does not name that vendor and does not replace it. Stemworks does not write a reservation, issue a key, or store a card number.

Stemworks is the record Marriott does not hold as one picture: the dining outlets, the gatherings (meetings, weddings, The Workshop, the convention center, the amphitheater), and the definite-versus-tentative revenue that sits across them. A general manager should see that picture without opening the PMS, the point-of-sale system, and a catering spreadsheet.

## Tenant boundary

Luminary is its own tenant. It is not a subsidiary of the Diaz Ventures LLC tenant. Diaz Ventures owns the software. The hotel's groups, planner contacts, and revenue are the hotel's data. Row-level security is what keeps those rows out of Jade Flowers, Jade Haven, and every later tenant. The legal name of the operating company is whatever the management agreement says. This document does not invent one. The tenant display name is Luminary Hotel & Co. `plan_tier` stays `internal` while Diaz Ventures is building the pilot. A later license tier does not move the rows.

Three ventures, so the existing rule — one role per subsidiary, owner sees the tenant — matches how the hotel is actually run:

| Venture | Prefix | `unit` | Who it is for |
| --- | --- | --- | --- |
| Luminary Rooms | `LHR` | `rooms` | 243 keys, the daily rooms flash, group room revenue |
| Luminary Dining | `LHD` | `dining` | The outlets. A dining manager sees this venture and not rooms margins |
| Luminary Gatherings | `LHG` | `gatherings` | Meetings, weddings, The Workshop, convention center, amphitheater, pool deck events |

`type` for all three is `boutique_hotel`. Module enablement is still explicit: each of the three has `hotel` on. The type does not turn the module on by itself. The owner sees all three in the header. A manager assigned to Dining who requests Rooms receives 404.

Jade Flowers, Jade Experiences, Jade Haven, and the Stemworks venture remain specified for the Diaz Ventures tenant. They are not seeded into the Luminary tenant, and they are not the first build.

## Property record

One `hotel_properties` row on the Rooms venture. The other two ventures reference it. They do not each invent a second hotel.

- Display name, Marriott code `RSWAK` as an external reference, street address, timezone `America/New_York`
- `keys` = 243
- Check-in 16:00, check-out 11:00, minimum age 21, pets not allowed
- Brand affiliation: Autograph Collection, Bonvoy participant. Stored as attributes. Stemworks does not call Bonvoy.
- Management company name: Mainsail Lodging & Development. An attribute, not a tenant and not a user.
- Mode is `operational`. There is no pre-open archive step.

A business date is a `date` in `America/New_York`. It is not a UTC timestamp truncated to a day. Flashes, classes, and group arrivals use that date. Hotel close is often after midnight; the business date is the date the hotel assigns, sent on the write, not inferred by the server from UTC.

## Outlets

Outlets are rows on the Dining venture. They are not subsidiaries, and they are not eight more permission domains. Topgolf Swing Suite is part of Chips, not its own restaurant. The Lobby Bar is its own row because it is a separate service point from Silver King; if the hotel's books combine them, the two rows still exist and one flash can post to either.

| Outlet | What it is |
| --- | --- |
| Silver King Coastal Kitchen | Signature restaurant. Mediterranean, tapas, chef's tasting menu, monthly wine dinners. |
| Lobby Bar | Bar with Silver King. |
| Ella Mae's Diner | Ground floor, Bay Street. Breakfast and dinner. Locals and guests. |
| Chips Sports Pub | Includes the Topgolf Swing Suite. |
| Oxbow Bar & Grill | About 120 seats, indoor and outdoor, steps from the hotel, with retail. Second floor is for groups. |
| Beacon Social Drinkery | Rooftop, twelve stories. |
| Dean Street Coffee Roastery & Retail | House coffee for the hotel, the outlets, and the convention center. Public bean roast Saturdays at 10:00. |
| Pool Bar | Fourth-floor pool. |
| In-room dining | Delivery from the kitchen, 7:00 a.m. to 11:00 p.m. |
| Lobby gift shop | Retail. Dean Street retail stays on the Dean Street row. |

Food-cost depletion, recipes, and a storeroom ledger are not this module. That would be a second inventory system. An outlet flash records net sales and covers. Cost of sales, when someone enters it, is a cents figure on that flash, snapshotted, not a bill of materials.

## Venues

Venues are rows on the Gatherings venture. Square feet are stored on the row with the source, because the public pages do not use one number for the convention center.

| Venue | Measure | Source |
| --- | --- | --- |
| Hotel function space | 10,000 sq ft indoor and outdoor | Marriott overview and 2026 fact sheet |
| The Workshop | 2,300 sq ft culinary theater, stadium seating | 2026 fact sheet |
| Pool event deck | 2,861 sq ft | 2026 fact sheet |
| Oxbow second floor | 3,800 sq ft | Marriott overview |
| Caloosa Sound Ballroom | 30,000 sq ft, inside the convention center, which the Marriott overview describes as 40,000 sq ft of event space | Fact sheet for the ballroom; overview for the center |
| Caloosa Sound Amphitheater | 93,080 sq ft outdoor | 2026 fact sheet |

The fact sheet's combined claim is more than 149,000 square feet across the hotel, the convention center, and the amphitheater. That sentence is marketing. The rows above are what the system stores. The convention center and the amphitheater are managed with the hotel and sit in the same tenant. They are not a second hotel and not a second tenant. The Workshop is a gatherings venue even though it is a kitchen. Its P&L is a class or a private function, not a dining-outlet flash.

## What the first build writes

Native, entered in Stemworks, and the system of record for these objects:

**Daily flash.** One row per venture per business date, and for Dining one row per outlet per business date. Rooms flash: `rooms_sold`, `room_revenue_cents`. Available keys come from `hotel_properties.keys` (243), not from a constant in the client. ADR in cents is `room_revenue_cents / rooms_sold` when rooms sold is greater than zero, computed on read. Occupancy is rooms sold over keys, computed on read. Dining flash: `net_sales_cents`, `covers`, optional `cost_of_sales_cents`. A flash is idempotent on (`subsidiary`, outlet or null, `business_date`). Replaying the same body returns the stored row. A different body for the same key returns 409. Corrections are a new audited write, not a silent overwrite of yesterday's cents without an audit row.

**Group and event deals.** The catering and sales pipeline the PMS does not present as one list. Status path: `inquiry → tentative → definite → lost`, plus `cancelled` from any open status. Fields: planner name and email (a person the sales team typed, not a guest downloaded from Marriott), arrival and departure business dates, room nights, `contracted_room_revenue_cents`, `food_and_beverage_minimum_cents`, `rental_cents`, venue, cutoff date. Definite deals publish their contracted room revenue onto the Rooms venture's potential and confirmed figures as defined below, and their minimum and rental onto Gatherings. The deal row lives on Gatherings. Rooms reads the room-revenue slice through the hotel module's own port, not through a cross-module join. Both ventures are the same module, so this read stays inside `hotel`.

**Workshop and other ticketed sessions.** Public classes (cooking, wine, coffee) and private buyouts of The Workshop. Capacity, `ticket_price_cents`, deposit, cost buckets for instruction, food, and overhead, registrations, attendance, no-show. Net profit is computed when the session is completed. This is the atelier shape — a session with a P&L — owned entirely by `hotel`. It does not import `atelier`, and it does not create candle batches. Unsold seats are capacity. They are not potential.

**Milestones and alerts**, through the kernel, the same as every other module. Cutoff dates, unsigned contracts, session dates, group arrivals. A tentative deal with no touch inside its silence threshold publishes `pipeline_stalled`. An unsigned definite-bound contract publishes `contract_unsigned`.

## Confirmed and Potential

Same definitions as the rest of Stemworks. Unsold rooms, empty restaurant seats, and empty theater seats are not potential.

**Rooms**

- Confirmed: `room_revenue_cents` on flashes whose business date is today or earlier, plus the contracted room revenue of deals in `definite` that have not yet been consumed by a flash. A flash that covers a consumed stay is the confirmed number for those nights, so the same dollars are not added twice. The deal stores `room_revenue_recognized_cents`, increased only when a flash is explicitly linked to that deal.
- Potential: confirmed, plus contracted room revenue of deals in `inquiry` or `tentative`. Remaining transient inventory at rack rate is not added.

**Dining**

- Confirmed: `net_sales_cents` posted on outlet flashes through the business date.
- Potential: confirmed, plus `food_and_beverage_minimum_cents` on open deals (`inquiry`, `tentative`, `definite`) that is not yet recognized on a flash. Walk-in covers nobody has booked are not potential.

**Gatherings**

- Confirmed: rental and collected tuition and deposits on definite deals and on completed or paid sessions, plus definite food-and-beverage minimums not yet posted to an outlet flash.
- Potential: confirmed, plus rental, minimums, and tuition on `inquiry` and `tentative` deals and on sessions that have registrations not yet paid.
- A public amphitheater concert is a session or a deal with ticket revenue. A talent roster that carries from show to show is `event-production`, and that module is not on for this tenant in the first build. The date, the guarantee or ticket revenue, and the cost buckets are enough to put the show on the timeline and in the P&L.

The header sums the three ventures in cents. Linking a flash to a deal is what prevents the sum from counting a banquet both as a contract and as a posted outlet sale.

## What the first build does not write

- Reservations, rate plans, room assignments, housekeeping status, mobile keys, folios, incidental charges, and payment cards. Those stay in the hotel's Marriott systems.
- Bonvoy profiles, guest stay history, and passport or ID data. A planner contact on a deal is the only person record this module stores, and it is entered by staff.
- Gift-card issuance and stored value. The hotel already sells cards that work on stays and in the outlets. Stemworks is not the card processor. A posted flash is net of whatever the point-of-sale system already did with a card.
- Point-of-sale check detail, item voids, and card receipts.
- Bike rentals through Zybra, dry cleaning, and parking transactions, until someone enters them as an outlet or a flash line on purpose. They are not implied by the amenities list.
- Recipes, stewarding inventory, and purchase orders for the kitchen.
- A guest-facing client portal.
- Jade Haven's lease, capital, and rent-to-revenue objects.
- Predicted occupancy. `intelligence` stays off. A rooms flash is what happened or what was typed. It is not a forecast.

## Connect, when a feed exists

Status rows exist in the first build. Adapter code does not. Until a feed is on, the flash and the deal are typed by a person, and the branch reads `not_connected`.

| Key | Label | What a later projector may write |
| --- | --- | --- |
| `native:hotel-rooms` | Rooms | Always live. The flash and the room slice of deals. |
| `native:hotel-dining` | Dining | Always live. Outlet catalog and flashes. |
| `native:hotel-gatherings` | Gatherings | Always live. Deals, venues, sessions. |
| `native:pipeline` | Pipeline CRM | Always live. The pipeline port. Not Salesforce and not a second CRM. |
| `integration:rooms-pms` | Rooms system | Occupancy, rooms sold, room revenue, arrival and departure counts. No guest name, no Bonvoy number, no card, no folio line. |
| `integration:outlet-pos` | Outlet point of sale | Per outlet, per business date: net sales and covers. No check, no card, no item. |

Craftybase, Square, and Shopify remain the adapters named for Jade Flowers. They are not Luminary's outlets. Square is not assumed to be the hotel's point of sale. The hotel's vendor is whatever is already installed, and the adapter is written against the inbox contract when that vendor is known. Domain code does not import it.

A projector inserts or updates a flash for that business date through the same idempotent write the screen uses. It does not open a second path that skips audit.

## Routes

Under `/api/v1`, all inside the `hotel` module, all behind the same authentication and row-level security as the kernel:

- `GET/PUT /hotel/property` — the single property. Put is owner-only.
- `GET/POST /outlets`, `GET/PATCH /outlets/:id`
- `GET/PUT /flashes` — idempotent on the business-date key described above. Body is cents and counts.
- `GET/POST /deals`, `GET/PATCH /deals/:id`
- `GET/POST /venues`
- `GET/POST /sessions`, `GET/PATCH /sessions/:id`, `POST /sessions/:id/registrations`, `PATCH /sessions/:id/registrations/:reg_id`
- `GET /hotel/pl?period=` — subsidiary P&L for a manager's venture, consolidated for the owner across the three Luminary ventures only.

Dashboard and branch routes are unchanged. They call the hotel pipeline port.

Associates may check a session guest in and may set deal operational status notes that are not money. They receive 403 on flashes, contracted cents, P&L, and any response field that is a cost or a margin. Managers may write their own venture. The owner may write all three and is the only role that receives the consolidated hotel P&L.

## Dashboard on day one

Three cards, all able to expand as soon as a flash, a deal, or a session exists.

- Luminary Rooms — status label "243 keys · operational". Confirmed and potential from flashes and the room slice of deals.
- Luminary Dining — status label names the outlet count. Top three items are the outlets or banquet minimums with the most money in motion, from the port, not from a hardcoded restaurant list in the web app.
- Luminary Gatherings — next session or group arrival as the milestone. Unsigned contracts and quiet tentatives on the attention rail.

The header is the sum of the three. The next milestone is the soonest group arrival, cutoff, or session. Empty ventures say they are empty. The seed does not ship sample groups or sample revenue.

## Security additions for this property

Guest data from Marriott is the hazard. The first build's rule is that it is not collected. Tests fail the build if a hotel table gains a column whose name matches a payment card, a Bonvoy identifier, a passport, or a folio. Planner email is allowed on the deal, excluded from logs, and covered by the same backup and retention rules as every other personal field.

A rooms-PMS or point-of-sale payload that contains a guest or a card is rejected at the inbox boundary and audited as a rejected fact. It is not stored "just in case" and stripped later.

The three ventures share a tenant and do not share a role. A dining token cannot read a rooms flash. That test is required before a second user is invited.
