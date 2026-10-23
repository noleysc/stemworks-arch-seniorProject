# Luminary Desk — slice tasks

Projection: `Booking` rows, SQLite. Money: `amountCents` integer cents. Business date: `America/New_York`, compared as `YYYY-MM-DD`. Confirmed and Potential are computed only in `lib/dashboard.ts`. Ingestion is CSV import and manual entry. Luminary, Marriott, and Airbnb pages are not read by the app.

| Owner | Paths |
| --- | --- |
| Nolan | `apps/web/fixtures/dashboard/`, acceptance |
| Esmir | `apps/web/lib/dashboard.ts`, `apps/web/app/api` |
| Ryan | `apps/web/app/dashboard`, `apps/web/components/dashboard` |
| Henry | `apps/web/app/rooms`, `app/restaurant`, `app/import`, `app/page.tsx`, `components/desk-nav.tsx`, collection forms |

Rules for the cents, the attention window, and the JSON shape are in [next-steps.md](next-steps.md).

## Nolan — acceptance

- Check in `apps/web/fixtures/dashboard/` with these rows:
  - `kind=room`, `channel=luminary_website`, `status=confirmed`, non-null `amountCents`
  - `kind=room`, `channel=airbnb`, `status=confirmed`, non-null `amountCents`
  - `kind=room`, `status=inquiry`, non-null `amountCents`
  - `kind=room`, `status=cancelled`, non-null `amountCents`
  - `kind=restaurant`, `outlet=silver_king`, `status=confirmed`, non-null `amountCents`
  - `kind=room`, `status=confirmed`, `arrivalDate = businessDate + 2`
  - `kind=room`, `status=confirmed`, `arrivalDate = businessDate + 10`
- Check in `expected.json` beside the fixture: `confirmedCents`, `potentialCents`, per-venture cents, `attention`, `milestones`. Values are hand-derived from the rows above.
- Load through `POST /api/v1/bookings` and `POST /api/v1/bookings/import`. Acceptance does not write SQLite directly.
- Block `/dashboard` implementation until `GET /api/v1/dashboard` matches `expected.json`.
- Block sign-off until the header cents, `nextMilestone`, attention rail, and three venture cards match that payload.
- File a defect against the owning path. A cents mismatch is fixed in `lib/dashboard.ts` before any UI change.
- Postgres, auth, and the daily flash stay blocked until the acceptance section passes.

## Esmir — `GET /api/v1/dashboard`

- Add `lib/dashboard.ts` and `app/api/v1/dashboard/route.ts`. Input is the current `Booking` table. UI code does not import Prisma.
- Query `venture`: omitted = all three. Allowed: `rooms`, `dining`, `gatherings`. Any other value returns `404`.
- Query `horizon`: omitted = 90 days. `12m` = 365 days.
- Open row: `status ∈ {inquiry, confirmed, arrived}` and end date ≥ business date. Room end date is `departureDate`. Restaurant end date is `arrivalDate`.
- `confirmedCents` = Σ `amountCents` of open rows with `status ∈ {confirmed, arrived}`. `amountCents = null` adds 0 and still increments `openCount`.
- `potentialCents` = `confirmedCents` + Σ `amountCents` of open `inquiry` rows.
- `completed`, `cancelled`, and `no_show` add 0 to both totals.
- `ventures.gatherings`: `confirmedCents = 0`, `potentialCents = 0`, `openCount = 0`, `expanded = false`, `statusLabel = "No gatherings collected yet"`.
- `attention[]` contains only `type = event_milestone_due`:
  - room, `status ∈ {confirmed, arrived}`, `0 ≤ arrivalDate − businessDate ≤ 3` → `"{guestName} arrives in {n} days · {channel}"`
  - restaurant, `status ∈ {confirmed, arrived}`, `arrivalDate = businessDate` → `"{guestName} is seated at {outlet} today"`
- `milestones[]`: open room arrivals and restaurant seatings inside the horizon, sorted by `dueOn` ascending. `completed` and `cancelled` are excluded.
- `header.nextMilestone`: earliest milestone, or `null`. `header.topAlert`: `attention[0]`, or `null`.
- `topItems`: up to 3 open rows per venture, ordered by `amountCents` descending. `stage` is `statusLabel(status, kind)`.
- Header totals are the sum of ventures in the active filter. Unsold keys, empty covers, and rack rate are not terms.
- `lib/dashboard.test.ts` asserts the fixture cents, the `+2` day attention item, the absence of the `+10` day row from `attention`, gatherings zeros, and `venture=jade` → `404`. Guest name, confirmation code, and notes stay out of application logs.
- Version the booking handlers. Keep the current paths as aliases to the same functions:
  - `GET|POST /api/bookings` → `/api/v1/bookings`
  - `PATCH|DELETE /api/bookings/:id` → `/api/v1/bookings/:id`
  - `POST /api/bookings/import` → `/api/v1/bookings/import`
  - `GET /api/bookings/template` → `/api/v1/bookings/template`
- Request bodies and status codes stay as they are. Remove the unversioned aliases after Henry's `fetch` calls use `/api/v1`.
- Out of scope for this slice: Postgres, `tenant_id`, RLS, auth, scrapers, PAN, Bonvoy id, folio lines.

## Ryan — `/dashboard`

- Route `apps/web/app/dashboard/page.tsx`. Components under `apps/web/components/dashboard/`. Sole data source: `GET /api/v1/dashboard`. No Prisma import. No client-side cents math.
- `/` stays the collection home.
- Header, sticky at `≥md`: `confirmedCents`, `potentialCents`, `potentialCents − confirmedCents`, `nextMilestone` countdown from `businessDate`, `topAlert` when non-null. Two money figures only.
- Attention rail maps `attention`. `attention.length = 0` renders an empty state, not a synthetic alert.
- Venture cards use payload `expanded`. Gatherings stays mounted at zero. `openCount > 0 && confirmedCents = 0` renders an explicit no-amount state. `topItems` show label, stage, `valueCents`.
- Timeline is horizontal. Color comes from `colorToken` (`rooms` | `dining` | `gatherings`). Default window is 90 days. The 12-month control refetches with `horizon=12m`.
- Venture switcher refetches the same route: `?venture=rooms|dining|gatherings`. All clears `venture`.
- `<md`: stack header, attention, cards, timeline. `≥md`: four zones in view; header does not leave the viewport.
- Pending fetch: loading state, no placeholder cents. Failed fetch: error state plus retry. Error state contains no fixture guests and no sample cents.
- Dashboard nav item is a change to `components/desk-nav.tsx`, owned by Henry. `/dashboard` is reachable by URL before that link lands.

## Henry — collection

- Rooms `BookingBoard`: filter `channel` to `luminary_website`, `airbnb`, or all.
- Restaurant `BookingBoard`: filter `outlet` to an `OUTLETS` key or all.
- Form and import `fetch` failure with no JSON body: error state. Submit stays disabled for the in-flight request.
- After the versioned routes return the current status codes, point `fetch` at:
  - `/api/v1/bookings`
  - `/api/v1/bookings/:id`
  - `/api/v1/bookings/import`
  - `/api/v1/bookings/template`
- Request bodies stay unchanged.
- Add a Dashboard item to `components/desk-nav.tsx`.
- `confirmedCents` and `potentialCents` render only on `/dashboard`.

## Acceptance

- Loading the fixture changes `GET /api/v1/dashboard` cents with no manual `Booking` write.
- `arrivalDate = businessDate + 2` is both `header.nextMilestone` and an `attention` item. `arrivalDate = businessDate + 10` is in `milestones` only.
- `ventures.gatherings` is present and zeroed.
- An `inquiry` `amountCents` is included in `potentialCents` and excluded from `confirmedCents`.
- A `cancelled` row changes neither total.
- Rooms, restaurant, and collect still support `POST` create, `POST` import, `PATCH` status, and `DELETE`.
- `npm test` and `npm run lint` pass in `apps/web`.
