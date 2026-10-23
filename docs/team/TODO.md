# Luminary Desk — team to-do list

Owners

- **Nolan** — team lead. Holds the rules in [next-steps.md](next-steps.md). Accepts the slice.
- **Esmir** — backend. Owns `apps/web/lib`, `apps/web/prisma`, and `apps/web/app/api`.
- **Ryan and Henry** — dashboard and frontend. For this slice, Ryan leads `apps/web/app/dashboard` and `apps/web/components/dashboard`. Henry leads the collection pages, filters, and `desk-nav.tsx`. They review each other's work. Swap the lead if that fits the day. Do not both edit the same file.

The screen reads bookings the desk already collects. It does not scrape Luminary, Marriott, or Airbnb. Confirmed and Potential are computed only in the API.

## Nolan

- [ ] Keep [next-steps.md](next-steps.md) as the only place the cents rules change. A wrong number is fixed in the API, then the screen picks it up.
- [ ] Confirm Ryan leads the dashboard files and Henry leads the collection files before they start, or swap that and tell them.
- [ ] When Esmir says `/api/v1/bookings` is ready, tell Henry to switch the forms.
- [ ] Accept the slice only when every item under "Done when" is true.
- [ ] After acceptance, unlock the later list. Do not start Postgres, login, or the daily flash during this slice.

## Esmir — backend

- [ ] Add `lib/dashboard.ts` that builds the `GET /api/v1/dashboard` payload from current SQLite bookings.
- [ ] Confirmed cents: open `confirmed` and `arrived` stays and tables. A room amount is the stay total. Do not multiply by nights.
- [ ] Potential cents: confirmed, plus open `inquiry` amounts. Cancelled, completed, and no-show add nothing.
- [ ] Gatherings returns zeros, `expanded: false`, status label "No gatherings collected yet".
- [ ] Top items are the three open bookings with the largest amount in that venture.
- [ ] Attention is only `event_milestone_due`: a confirmed or arrived room arriving today or within three business days, and a table seated today. Do not mark inquiries as stalled.
- [ ] Milestones are open arrivals and seatings for 90 days. `horizon=12m` uses 365 days.
- [ ] `venture` omitted means all three. `rooms`, `dining`, and `gatherings` filter. Any other value, including `jade`, returns 404.
- [ ] Tests insert a fixed set of bookings and assert cents, the three-day alert, the empty gatherings card, and the 404. Do not log guest names.
- [ ] Move booking handlers to `/api/v1/bookings`, `/api/v1/bookings/:id`, `/api/v1/bookings/import`, and `/api/v1/bookings/template`.
- [ ] Keep `/api/bookings` as aliases that call the same functions. Tell Nolan and Henry when the versioned paths are ready.
- [ ] After Henry switches the forms, delete the `/api/bookings` aliases.
- [ ] Do not add Postgres, login, a scraper, or a Marriott or Airbnb client in this slice.

## Ryan — dashboard

- [ ] Add `/dashboard`. Leave `/` as the collection home.
- [ ] Render only `GET /api/v1/dashboard`. Do not import Prisma and do not recompute cents.
- [ ] Command header stays pinned on desktop: Confirmed, Potential, the gap, the next milestone and countdown, and one alert when `topAlert` is present. No third number.
- [ ] Attention rail lists the `attention` array. Empty copy: nothing is due in the next three days.
- [ ] Three venture cards. Gatherings stays visible and quiet. A card with stays and zero cents says the amount is missing.
- [ ] Timeline is horizontal, colored by `colorToken`, 90 days by default. Choosing 12 months refetches with `horizon=12m`.
- [ ] Venture switcher refetches `?venture=`. "All ventures" clears it. Same page.
- [ ] Phone stacks header, attention, cards, timeline. Desktop shows all four. The header does not scroll away on desktop.
- [ ] Loading is a quiet waiting state. A failed fetch says the board could not be loaded and offers a retry. No sample guests and no sample dollars.
- [ ] Ask Henry for the Dashboard link in `desk-nav.tsx`. Until it lands, `/dashboard` still works as a direct URL.

## Henry — frontend

- [ ] Rooms board: filter by Luminary website, Airbnb, or all.
- [ ] Restaurant board: filter by outlet.
- [ ] If a save or import fails before a JSON body comes back, say the desk could not be reached. Keep the submit button disabled while a save is in flight.
- [ ] When Esmir says the versioned routes are ready, point every `fetch` at `/api/v1/bookings`. Request bodies stay the same.
- [ ] Add a Dashboard link in `desk-nav.tsx` to `/dashboard`.
- [ ] Do not put Confirmed or Potential on the Rooms, Restaurant, or Collect pages.

## Done when

- [ ] An Airbnb import and a restaurant import change Confirmed and Potential on `/dashboard` with no hand edit of the database. (Esmir, Ryan)
- [ ] A confirmed arrival two days out is the header milestone and an attention item. An arrival ten days out is on the timeline and not in the rail. (Esmir, Ryan)
- [ ] Gatherings is on the screen at zero, labeled as not yet collected. (Ryan)
- [ ] An inquiry amount is inside Potential and outside Confirmed. (Esmir)
- [ ] A cancelled stay changes neither number. (Esmir)
- [ ] Rooms, Restaurant, and Collect still create, import, update status, and remove. (Henry)
- [ ] `npm test` and `npm run lint` in `apps/web` pass, including the projection tests. (Esmir)

## Later — Nolan unlocks these

- [ ] Postgres, `tenant_id`, the three Luminary ventures, and row-level security. The dashboard JSON does not change. (Esmir)
- [ ] Owner login, one owner, with manager and associate checks tested before those users exist. (Esmir, then Ryan and Henry send the cookie the security doc already specifies)
- [ ] Group deals and the daily flash. Nolan updates the cents rules in [next-steps.md](next-steps.md) before Esmir changes the projection. (Nolan, Esmir)
