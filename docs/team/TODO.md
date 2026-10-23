# Luminary Desk — slice instructions

Projection input is the `Booking` table in SQLite. Money is `amountCents` (integer cents). The business date is `America/New_York`, stored and compared as `YYYY-MM-DD`. Confirmed and Potential are computed only in `lib/dashboard.ts`. Ingestion is `POST` JSON and CSV import. The app does not read Luminary, Marriott, or Airbnb pages.

Day delta is calendar days, not elapsed hours. Parse both `YYYY-MM-DD` values as UTC midnight and divide by `86400000`. A room amount is the stay total. Do not multiply by nights.

| Owner | Writes | Reads |
| --- | --- | --- |
| Nolan | `apps/web/fixtures/dashboard/`, acceptance record | `GET /api/v1/dashboard`, `/dashboard` |
| Esmir | `apps/web/lib/dashboard.ts`, `apps/web/app/api/v1/**` | `Booking`, Nolan's fixture |
| Ryan | `apps/web/app/dashboard`, `apps/web/components/dashboard` | `GET /api/v1/dashboard` |
| Henry | collection pages, forms, `components/desk-nav.tsx`, `components/booking-board.tsx` | existing booking routes, then `/api/v1/bookings` |

Ryan reviews Henry's collection diff. Henry reviews Ryan's `/dashboard` diff. Esmir does not import UI components. Ryan and Henry do not import Prisma.

## Shared payload

`GET /api/v1/dashboard`

Query:

| Param | Values | Default | Other value |
| --- | --- | --- | --- |
| `venture` | `rooms`, `dining`, `gatherings` | omitted = `all` | `404` `{ "error": "Unknown venture." }` |
| `horizon` | `12m` | omitted = 90 days | ignored; window stays 90 |

`venture` set: `ventures`, `attention`, and `milestones` contain only that venture. Omitted: all three ventures, order `rooms`, `dining`, `gatherings`.

```json
{
  "businessDate": "2026-10-23",
  "timezone": "America/New_York",
  "venture": "all",
  "header": {
    "confirmedCents": 0,
    "potentialCents": 0,
    "nextMilestone": null,
    "topAlert": null
  },
  "ventures": [],
  "attention": [],
  "milestones": []
}
```

`nextMilestone`: `{ "title", "dueOn", "venture", "colorToken" }` or `null`.

`topAlert`: `{ "type": "event_milestone_due", "body" }` or `null`. `topAlert` is `attention[0]`.

Venture object:

```json
{
  "key": "rooms",
  "name": "Luminary Rooms",
  "colorToken": "rooms",
  "expanded": true,
  "statusLabel": "243 keys · operational",
  "confirmedCents": 0,
  "potentialCents": 0,
  "openCount": 0,
  "nextMilestone": null,
  "topItems": []
}
```

Dining `name` is `Luminary Dining`, `statusLabel` is `Outlets operational`, `colorToken` is `dining`. Gatherings `name` is `Luminary Gatherings`, `statusLabel` is `No gatherings collected yet`, `colorToken` is `gatherings`, `expanded` is `false`, and every figure is `0`.

`topItems[]`: `{ "label", "stage", "valueCents", "kind" }`. At most 3. `stage` is `statusLabel(status, kind)` from `lib/catalog.ts` (`arrived` + room = `In house`, `arrived` + restaurant = `Seated`).

`milestones[]`: `{ "id", "venture", "title", "dueOn", "kind": "event_date", "colorToken" }`.

Open row: `status ∈ {inquiry, confirmed, arrived}` and end date ≥ business date. Room end date is `departureDate`. Restaurant end date is `arrivalDate`. `completed`, `cancelled`, and `no_show` add `0` and are absent from attention, milestones, and `topItems`.

`confirmedCents` = Σ `amountCents` of open rows with `status ∈ {confirmed, arrived}`. `amountCents = null` adds `0` and still increments `openCount`. `potentialCents` = `confirmedCents` + Σ `amountCents` of open `inquiry` rows. Header cents are the sum of the ventures in the active filter. Unsold keys, empty covers, and rack rate are not terms.

## Nolan — fixture and acceptance

Owns `apps/web/fixtures/dashboard/bookings.json` and `expected.json`. The frozen business date inside both files is `2026-10-23`. Offsets are calendar days from that date. Esmir's unit tests import this fixture and pass `businessDate: "2026-10-23"` into the projector. The live desk uses `businessToday()`; reload the same rows with offsets applied to the clock date before a screen check. Acceptance does not `INSERT` into SQLite.

### Rows

Amounts in the CSV are dollar strings. `amountCents` is what the row must store after import.

| Code | Stream | Guest | Status | Offset in | Offset out | Party | Amount | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `LW-1001` | `luminary_website` | Mara Ellison | `confirmed` | +2 | +5 | 2 | `640.50` | King. Attention and timeline. |
| `AB-2002` | `airbnb` | Jonah Peck | `confirmed` | +10 | +13 | 2 | `412.00` | Timeline only. |
| `LW-1003` | `luminary_website` | Priya Shah | `inquiry` | +20 | +22 | 2 | `300.00` | Potential only. Timeline. |
| `LW-1004` | `luminary_website` | Elena Voss | `cancelled` | +7 | +9 | 2 | `500.00` | Neither total. Neither list. |
| `SK-3005` | `restaurant` / `silver_king` | Chris Adeyemi | `confirmed` | +0 | — | 4 | `186.40` | Time `19:00`. Attention and timeline. |
| `AB-2006` | `airbnb` | Lane Ortiz | `confirmed` | +39 | +41 | 2 | blank | `amountCents = null`. Timeline. Count without cents. |
| `LW-1007` | `luminary_website` | Helen Cho | `arrived` | −1 | +2 | 2 | `220.00` | In house. Cents only. Arrival is in the past, so no timeline row and no attention row. |

Restaurant channel stored on the row is `restaurant`. Outlet key is `silver_king`.

CSV files, headers exactly as `templateCsv`:

- `luminary-website.csv` — `confirmation_code,guest_name,arrival_date,departure_date,room_type,party_size,amount,status,notes` — rows `LW-1001`, `LW-1003`, `LW-1004`, `LW-1007`.
- `airbnb.csv` — `Confirmation code,Guest name,Start date,End date,Listing,# of adults,# of children,Earnings,Status` — rows `AB-2002`, `AB-2006`. Adults `2`, children `0`. Earnings blank on `AB-2006`.
- `restaurant.csv` — `outlet,guest_name,date,time,party_size,confirmation_code,amount,status,notes` — outlet text `Silver King`, time `7:00 PM`, code `SK-3005`.

Load order: `POST /api/v1/bookings/import` with `{ "stream", "csv" }` once per file. Second import of the same file must return `created: 0` and `updated` equal to the row count. Upsert key is `channel` + `confirmationCode`. A manual spot check uses one `POST /api/v1/bookings` room body, then `DELETE` that id so the fixture totals stay intact.

Room `POST` body:

```json
{
  "kind": "room",
  "channel": "luminary_website",
  "guestName": "Mara Ellison",
  "partySize": 2,
  "arrivalDate": "2026-10-25",
  "departureDate": "2026-10-28",
  "roomType": "King",
  "confirmationCode": "LW-1001",
  "status": "confirmed",
  "amount": "640.50",
  "notes": ""
}
```

`201` `{ "id" }`. Restaurant `kind` is `restaurant`, requires `outlet` and `reservationTime` (`HH:MM`), and has no `departureDate` or `channel` field. Unknown `kind` is `400`.

### Expected cents at `2026-10-23`

| Scope | confirmedCents | potentialCents | openCount |
| --- | --- | --- | --- |
| Rooms | 127250 | 157250 | 5 |
| Dining | 18640 | 18640 | 1 |
| Gatherings | 0 | 0 | 0 |
| Header, `venture` omitted | 145890 | 175890 | — |
| Header, `venture=rooms` | 127250 | 157250 | — |
| Header, `venture=dining` | 18640 | 18640 | — |
| Header, `venture=gatherings` | 0 | 0 | — |

Rooms confirmed = `64050 + 41200 + 22000 + 0`. Potential adds Priya `30000`. Elena `50000` is excluded. Gap on the all-venture header is `potentialCents - confirmedCents` = `30000`.

Attention, `dueOn` ascending, then `guestName` ascending:

1. `Chris Adeyemi is seated at Silver King Coastal Kitchen today`
2. `Mara Ellison arrives in 2 days · Luminary website`

`header.nextMilestone` on the all-venture response is Chris: title `Chris Adeyemi · Silver King Coastal Kitchen`, `dueOn` = business date, `venture` `dining`, `colorToken` `dining`. `header.topAlert.body` is the Chris sentence. `type` is `event_milestone_due`.

`venture=rooms` drops Chris. `nextMilestone.title` is `Mara Ellison arrives`. Attention has one item, Mara. `venture=gatherings` has `nextMilestone: null`, `topAlert: null`, `attention: []`, `milestones: []`.

Milestones for `venture` omitted, `dueOn` ascending: Chris (`+0`), Mara (`+2`), Jonah (`+10`), Priya (`+20`), Lane (`+39`). Helen and Elena are absent. Room title shape is `{guestName} arrives`. Restaurant title shape is `{guestName} · {outletLabel}`.

Rooms `topItems` in order: Mara `64050` stage `Confirmed` kind `luminary_website`; Jonah `41200` stage `Confirmed` kind `airbnb`; Priya `30000` stage `Inquiry` kind `luminary_website`. Helen (`22000`, stage `In house`) is fourth and omitted. Dining `topItems`: Chris `18640` stage `Confirmed` kind `restaurant`.

`venture=jade` returns `404`.

### Gates

- Block Ryan until `GET /api/v1/dashboard` matches `expected.json` for the omitted venture, `venture=rooms`, `venture=dining`, `venture=gatherings`, and `horizon=12m` (same rows; Lane at `+39` is inside both windows).
- Block sign-off until `/dashboard` shows header cents `formatMoney(145890)` and `formatMoney(175890)`, the gap, Chris as next milestone, both attention sentences, and three venture cards with Gatherings at `$0.00`.
- A cents mismatch is a defect in `lib/dashboard.ts`. The screen is not patched to agree with a wrong payload.
- Postgres, auth, `tenant_id`, RLS, and the daily flash stay blocked until the acceptance section at the bottom of this file passes.

## Esmir — `lib/dashboard.ts` and `/api/v1`

### Files

- `apps/web/lib/dashboard.ts` — pure projection. Signature `projectDashboard(rows: BookingRecord[], options: { businessDate: string; venture?: "rooms" | "dining" | "gatherings"; horizonDays: number })`. No Prisma call inside the function. The route loads rows, then calls it.
- `apps/web/app/api/v1/dashboard/route.ts` — `GET`. `businessDate` is `businessToday()` from `lib/dates.ts`. `horizonDays` is `365` when `horizon=12m`, else `90`. `dynamic = "force-dynamic"`.
- `apps/web/lib/dashboard.test.ts` — import `apps/web/fixtures/dashboard/bookings.json`. Assert every figure in Nolan's expected table, both attention bodies, milestone confirmation-code order, rooms `topItems` order, gatherings zeros, and `venture=jade` mapped to the route's `404`. Tests pass the frozen `businessDate`. Guest name, confirmation code, and notes are not written to `console`.

### Projection rules

Attention contains only `type = event_milestone_due`.

- Room, `status ∈ {confirmed, arrived}`, `0 ≤ arrivalDelta ≤ 3`: delta `0` body is `{guestName} arrives today · {channelLabel}`. Delta `n > 0` body is `{guestName} arrives in {n} days · {channelLabel}`. `channelLabel` comes from `lib/catalog.ts` (`Luminary website`, `Airbnb`).
- Restaurant, `status ∈ {confirmed, arrived}`, `arrivalDate = businessDate`: `{guestName} is seated at {outletLabel} today`. `outletLabel("silver_king")` is `Silver King Coastal Kitchen`.
- Inquiry rows are not attention items. The desk has no last-touch column, so no `pipeline_stalled` row is emitted.

Milestones: open rooms and open restaurants with `0 ≤ dueDelta ≤ horizonDays`. Room `dueOn` is `arrivalDate`. Restaurant `dueOn` is `arrivalDate`. Sort `dueOn` ascending, then `guestName` ascending. `id` is `Booking.id`.

`header.nextMilestone` is the first milestone, or `null` when the list is empty. Per-venture `nextMilestone` is the first milestone of that venture.

`topItems`: open rows of that venture, `amountCents` descending, `null` sorted last, `guestName` ascending as the tie break. Slice 3. `label` is `guestName`. `valueCents` is `amountCents ?? 0`. `kind` is `channel`.

`expanded` is `true` when `openCount > 0`. Gatherings `openCount` is always `0`, so `expanded` stays `false`.

### Booking routes

Move the handlers. The unversioned paths stay as aliases that call the same functions until Henry's `fetch` URLs are on `/api/v1`. Then delete the aliases.

| Alias | Versioned | Methods | Success |
| --- | --- | --- | --- |
| `/api/bookings` | `/api/v1/bookings` | `GET`, `POST` | `GET` `{ bookings }`. `POST` `201` `{ id }` |
| `/api/bookings/:id` | `/api/v1/bookings/:id` | `PATCH`, `DELETE` | `{ ok: true }`. Bad status `400`. Missing id on `DELETE` `404` |
| `/api/bookings/import` | `/api/v1/bookings/import` | `POST` | `{ created, updated, issues }`. Body `{ stream, csv }`. `csv.length > 1500000` → `413` |
| `/api/bookings/template` | `/api/v1/bookings/template` | `GET` | `text/csv` from `templateCsv`. `?stream=` required |

`GET /api/v1/bookings?kind=` allows `room` and `restaurant` only. Any other `kind` stays `400` `{ "error": "Unknown booking kind." }`. Request bodies and Zod schemas in `lib/bookings.ts` stay unchanged. `roomInputSchema` and `restaurantInputSchema` are the contract.

Out of scope in this slice: Postgres, `tenant_id`, RLS, auth cookies, scrapers, a Marriott or Airbnb client, PAN, Bonvoy id, folio lines.

## Ryan — `/dashboard`

### Files

- `apps/web/app/dashboard/page.tsx` — client page. `/` stays the collection home.
- `apps/web/components/dashboard/command-header.tsx`
- `apps/web/components/dashboard/attention-rail.tsx`
- `apps/web/components/dashboard/venture-cards.tsx`
- `apps/web/components/dashboard/milestone-timeline.tsx`
- `apps/web/components/dashboard/types.ts` — TypeScript types matching the payload above. No second money field, no `predictedCents`.

Data source is `GET /api/v1/dashboard` only. No Prisma import. No sum of `topItems` on the client. Render `header.confirmedCents` and `header.potentialCents` through `formatMoney` in `lib/money.ts`.

### Zones

1. Command header. Sticky at the `md` breakpoint (`position: sticky; top: 0` inside the page, below `DeskNav`). Shows `formatMoney(confirmedCents)`, `formatMoney(potentialCents)`, `formatMoney(potentialCents - confirmedCents)`, the next milestone title, and a countdown from `businessDate` to `dueOn`. Countdown copy: delta `0` = `Today`, delta `1` = `Tomorrow`, else `In {n} days`. When `topAlert` is non-null, one line, `topAlert.body`. When `topAlert` is null, that line is absent. Two money figures plus the gap. No third money figure.
2. Attention rail. Map `attention` in payload order. `attention.length = 0` renders `Nothing due in the next 3 days.` No synthetic alert.
3. Venture cards. One card per `ventures[]` entry, payload order. Honor `expanded`. Gatherings stays mounted when `expanded` is `false`. Each card shows `name`, `statusLabel`, both cent fields, `openCount`, `nextMilestone`, and `topItems` (`label`, `stage`, `formatMoney(valueCents)`). `openCount > 0 && confirmedCents = 0 && potentialCents = 0` renders `Open stays have no amount yet.` A zero Gatherings card renders `$0.00`, not an em dash.
4. Milestone timeline. Horizontal list. Bar or chip color from `colorToken`: `rooms` → `bg-stone-950`, `dining` → `bg-amber-800`, `gatherings` → `bg-stone-400`. Default request omits `horizon`. A `12 months` control refetches with `horizon=12m` and keeps the current `venture` query. Label each item with `title` and `dueOn`.

Venture switcher refetches the same route. `All` clears `venture`. `Rooms`, `Dining`, and `Gatherings` set `?venture=rooms|dining|gatherings`. The switcher does not hide cards that the payload still contains.

### Layout and states

- Width `< md`: stack header, attention, cards, timeline.
- Width `≥ md`: four zones visible together. The command header does not scroll off the viewport.
- Pending: skeleton or `Loading the board.` No `$0.00` placeholder standing in for a response that has not arrived. No guest names.
- `fetch` rejection or non-OK status: `The board could not be loaded.` Button label `Retry` repeats the same request. The error state contains no fixture guest and no sample cents.
- Dashboard link in the nav is Henry's edit to `components/desk-nav.tsx`. `/dashboard` is a direct URL before that link exists. Ryan does not edit `desk-nav.tsx` in the same change as the page.

With Nolan's fixture loaded at the frozen date, the all-venture screen shows `$1,458.90` confirmed, `$1,758.90` potential, gap `$300.00`, next milestone Chris Adeyemi, attention Chris then Mara, rooms card expanded with three top items, dining card expanded with Chris, gatherings card collapsed at `$0.00`.

## Henry — collection

### Files

- `apps/web/components/booking-board.tsx`
- `apps/web/components/room-form.tsx`
- `apps/web/components/restaurant-form.tsx`
- `apps/web/components/import-panel.tsx`
- `apps/web/components/desk-nav.tsx`

`BookingBoard` already filters by search text and by `upcoming | all` via `isUpcoming`. Those stay.

Rooms board (`kind="room"`): add a `Select` bound to local state `channelFilter: "all" | "luminary_website" | "airbnb"`. Labels: `All channels`, `Luminary website`, `Airbnb`. The filter is client-side on `booking.channel`. It does not refetch.

Restaurant board (`kind="restaurant"`): add `outletFilter: "all" | OutletKey` using `OUTLETS` from `lib/catalog.ts`. Label for `all` is `All outlets`. Other labels are `outlet.label`. Filter on `booking.outlet`.

### Requests

Current `fetch` URLs:

| Caller | Method | URL |
| --- | --- | --- |
| `room-form.tsx` | `POST` | `/api/bookings` |
| `restaurant-form.tsx` | `POST` | `/api/bookings` |
| `booking-board.tsx` | `PATCH` | `/api/bookings/:id` body `{ "status" }` |
| `booking-board.tsx` | `DELETE` | `/api/bookings/:id` |
| `import-panel.tsx` | `POST` | `/api/bookings/import` body `{ stream, csv }` |
| `import-panel.tsx` template link | `GET` | `/api/bookings/template?stream=` |

After `GET /api/v1/bookings?kind=room` and a room `POST /api/v1/bookings` return the same status codes as the aliases, replace every URL above with the `/api/v1` path. Bodies stay the same. `import-panel.tsx` still stores `{ created, updated, issues }` on the form after `router.refresh()`.

Network failure is a thrown `fetch`, not an HTTP 4xx. On throw, set the error string to `The desk could not be reached.` HTTP errors keep the server `error` string. `pending` stays `true` until the promise settles, and the submit control stays disabled while `pending` is `true`.

### Nav

Add `{ href: "/dashboard", label: "Dashboard" }` to the `links` array in `desk-nav.tsx`, after Collect. Active state remains `pathname === href`.

`confirmedCents` and `potentialCents` are rendered only on `/dashboard`. `/`, `/rooms`, `/restaurant`, and `/import` do not compute or display them.

## Acceptance

- Importing the three fixture CSVs changes `GET /api/v1/dashboard` to the cent table above with no manual `Booking` write.
- Re-import updates in place (`created: 0`).
- Chris is `header.nextMilestone` and `attention[0]` when `venture` is omitted. Mara is `attention[1]` and a milestone. Jonah is a milestone and is absent from `attention`.
- Gatherings is present, `expanded: false`, cents `0`.
- Priya's `30000` is inside `potentialCents` and outside `confirmedCents`.
- Elena's `50000` changes neither total and appears in neither list.
- Lane increments rooms `openCount` and adds `0` cents.
- Helen is `In house` on the rooms board, included in rooms confirmed, and absent from the timeline.
- Rooms, restaurant, and collect still support `POST` create, `POST` import, `PATCH` status, and `DELETE`.
- From `apps/web`: `npm test` and `npm run lint` pass. `lib/dashboard.test.ts` is part of `tsx --test lib/*.test.ts`.
