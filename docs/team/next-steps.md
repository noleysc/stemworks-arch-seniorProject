# Next steps — frontend, backend, dashboard

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

The team lead owns the whole project. Three people take the next slice. This document is the work split. It does not reopen the architecture in [../architecture/README.md](../architecture/README.md) or the property contract in [../architecture/luminary.md](../architecture/luminary.md).

## Where the work stands

Luminary Desk is running in `apps/web`. It collects three kinds of bookings and nothing else:

- Room stays whose channel is the Luminary website
- Room stays whose channel is Airbnb
- Restaurant reservations for the hotel's outlets

People type a booking, or they import a CSV the hotel exported. The public Luminary site, Marriott reservation search, and Airbnb host pages are not scraped. Money is integer cents. The business date is America/New_York.

What is on screen today is a collection desk: Today, Rooms, Restaurant, and Collect. It is not yet the four-zone manager dashboard in [../architecture/dashboard.md](../architecture/dashboard.md). There is no login, no Postgres, and no row-level security. The API lives in Next.js route handlers under `/api/bookings`, not `/api/v1`.

## The slice

Build the manager screen on top of the bookings already being collected. Keep the collection desk working while that screen appears.

The screen answers the four questions, using only booking rows:

1. Confirmed and Potential, in cents
2. The next arrival or seating
3. The arrivals that need a person in the next three days
4. Rooms, Dining, and Gatherings, with Gatherings quiet because no gathering has been collected

Flashes, group deals, Workshop sessions, Postgres, and owner login come after this slice. They are listed at the end so they are not mixed into the screen.

## How the three roles meet

Backend owns the numbers. Dashboard owns the screen that renders those numbers. Frontend owns the collection desk the numbers come from. The team lead is the only person who changes the rules in this file. A number that looks wrong gets fixed in the API, then the screen picks it up. The screen does not adjust cents on its own.

| Path | Owner |
| --- | --- |
| `apps/web/app/rooms`, `app/restaurant`, `app/import`, `app/page.tsx` | Frontend |
| `apps/web/components/room-form.tsx`, `restaurant-form.tsx`, `import-panel.tsx`, `booking-board.tsx`, `desk-nav.tsx` | Frontend |
| `apps/web/lib`, `apps/web/prisma`, `apps/web/app/api` | Backend |
| `apps/web/app/dashboard`, `apps/web/components/dashboard` | Dashboard |

Dashboard does not import Prisma. Frontend does not compute Confirmed or Potential. Backend does not lay out the four zones.

## The response the dashboard renders

`GET /api/v1/dashboard`

Optional query: `venture=rooms`, `venture=dining`, or `venture=gatherings`. Omitted means all three. Any other value is 404.

```json
{
  "businessDate": "2026-10-16",
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

`nextMilestone` and `topAlert` are objects or null:

```json
{ "title": "Mara Ellison arrives", "dueOn": "2026-11-02", "venture": "rooms", "colorToken": "rooms" }
```

```json
{ "type": "event_milestone_due", "body": "Mara Ellison arrives in 2 days · Luminary website" }
```

Each venture:

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
  "topItems": [
    { "label": "Mara Ellison", "stage": "Confirmed", "valueCents": 64050, "kind": "luminary_website" }
  ]
}
```

Dining's status label is "Outlets operational". Gatherings' status label is "No gatherings collected yet", `expanded` is false, and every figure is zero.

Milestones:

```json
{ "id": "booking-id", "venture": "dining", "title": "Chris Adeyemi · Silver King", "dueOn": "2026-11-10", "kind": "event_date", "colorToken": "dining" }
```

Color tokens are `rooms`, `dining`, and `gatherings`. The screen maps those tokens to color. It does not switch on the guest's name or the outlet.

### How the cents are chosen

A room amount is the stay total, not a nightly rate. Do not multiply by nights. A booking with no amount counts as a stay and adds zero cents, so a missing price stays visible as a count that is larger than the money.

Open means status is `inquiry`, `confirmed`, or `arrived`, and the stay or seating has not ended. For a room, the end is the departure date. For a table, the end is the reservation date. `completed`, `cancelled`, and `no_show` add nothing. Dates compare as `YYYY-MM-DD` against the business date.

| Venture | Confirmed | Potential |
| --- | --- | --- |
| Rooms | Open stays in `confirmed` or `arrived` | Confirmed, plus open stays in `inquiry` |
| Dining | Open tables in `confirmed` or `arrived` | Confirmed, plus open tables in `inquiry` |
| Gatherings | 0 | 0 |

Unsold keys, empty seats, and rack rate are not added. Covers are a count on the dining card, not dollars.

The header sums the ventures in the current filter. Rooms and dining inside one filter are the only contributors until gatherings exist.

Top items are the three open bookings with the largest `amountCents` in that venture. Stage is the status label the desk already uses ("In house", "Seated", "Inquiry", "Confirmed").

### Attention and the timeline

Attention contains only `event_milestone_due`. A confirmed or arrived room whose arrival is today or within the next three business days produces one item: "{guest} arrives in {n} days · {channel}". A table on today's business date produces "{guest} is seated at {outlet} today". Nothing else is invented. Inquiry bookings stay in Potential. They are not labeled stalled, because the desk does not yet store a last-touch date.

The timeline lists open room arrivals and open table seatings whose date falls in the next 90 days, soonest first. A `horizon=12m` query extends that window to 365 days. Completed and cancelled rows stay off the timeline. They remain on the Rooms and Restaurant pages.

## Backend

Ship `GET /api/v1/dashboard` against the current SQLite bookings, using the rules above. Put the projection in `lib/dashboard.ts` with tests that insert a fixed set of bookings and assert the cents, the three-day alert, the empty gatherings card, and a 404 for `venture=jade`. No guest name, confirmation code, or note in the test output that gets logged. Assertions belong in the test file, not in application logs.

Move the existing booking handlers to `/api/v1/bookings`, `/api/v1/bookings/:id`, `/api/v1/bookings/import`, and `/api/v1/bookings/template`. Keep the current `/api/bookings` paths as aliases that call the same functions, so the desk does not break on the day the prefix changes. Tell frontend when the versioned paths are ready. Frontend removes the aliases in the same slice, and backend deletes them after that.

Do not start Postgres, login, or a scraper in this slice. Do not add a Marriott or Airbnb client. Do not store a card, a Bonvoy number, or a folio line.

## Dashboard

Add `/dashboard`. Leave `/` as the collection home.

The page is one screen, four zones, fed only by `GET /api/v1/dashboard`:

1. Command header, pinned on desktop. Confirmed, Potential, the gap between them, the next milestone with a countdown from the business date, and one alert line when `topAlert` is present. No third number.
2. Attention rail. The `attention` array. Empty means a sentence that there is nothing due in the next three days, not a placeholder alert.
3. Venture cards. Render `expanded` from the payload. Gatherings stays visible and quiet. Top items show label, stage, and money. A card with `openCount` greater than zero and cents of zero says the stays have no amount yet.
4. Milestone timeline. Horizontal, colored by `colorToken`, 90 days unless the person chooses 12 months, which refetches with `horizon=12m`.

A venture switcher refetches with `?venture=`. "All ventures" clears it. This is the same page.

Phone order is header, attention, cards, timeline. Desktop shows all four at once. The header does not scroll away on desktop.

Loading is a quiet waiting state. A failed fetch says the board could not be loaded and offers a retry. It does not show sample guests or sample dollars.

Nav gains a Dashboard link. Frontend owns `desk-nav.tsx`, so the dashboard person asks frontend for that link rather than editing the nav in parallel. Until the link exists, `/dashboard` is still a direct URL.

## Frontend

Keep collection reliable while the other two build the screen.

- Rooms board: filter by Luminary website, Airbnb, or all. The channel is already on each booking.
- Collect: when a file imports with skipped rows, keep the row errors on screen after refresh. Today a refresh clears them because they live only in component state. Persist is unnecessary. Surviving a `router.refresh()` is enough, which means do not refresh in a way that unmounts the result, or lift the result above the refresh.
- Forms: show a loading state that disables the submit button, which already exists, and keep the field error next to the form, which already exists. Add an error state if the network fails before a JSON body comes back.
- Point every `fetch` at `/api/v1/bookings` once backend says the versioned routes are up. The request bodies stay the same.
- Do not add Confirmed or Potential to the Rooms or Restaurant pages. Those figures live on `/dashboard`.

## Done when

- Importing an Airbnb export and a restaurant list changes Confirmed and Potential on `/dashboard` without a manual database edit.
- A confirmed arrival two days out appears in the header's next milestone and in the attention rail. An arrival ten days out appears on the timeline and not in the rail.
- Gatherings is on the screen, at zero, and labeled as not yet collected.
- An inquiry's amount is inside Potential and outside Confirmed.
- A cancelled stay changes neither number.
- Rooms, Restaurant, and Collect still create, import, update status, and remove.
- `npm test` and `npm run lint` in `apps/web` pass. The new tests cover the projection.

## After this slice

Only after the screen is telling the truth about bookings:

1. Backend moves the same API onto Postgres with `tenant_id`, the three Luminary ventures, and the row-level security rules in [../architecture/security.md](../architecture/security.md). The JSON above does not change.
2. Backend adds owner login. One owner. The checks for manager and associate exist as tests before those users exist. Dashboard and frontend send the cookie the security document already specifies. They do not invent a second session design.
3. Backend adds group deals and the daily flash from [../architecture/luminary.md](../architecture/luminary.md). Dashboard keeps rendering the same response. The cents rules in that property contract replace the booking-only rules in this file when the flash is real, and the team lead updates this file first.
