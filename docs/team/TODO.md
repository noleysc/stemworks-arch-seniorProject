# Luminary Desk to-dos

Ryan leads the dashboard files. Henry leads the collection files. They review each other. Esmir owns the API. Nolan owns the fixture, the expected numbers, and acceptance.

Confirmed and Potential are computed only in the API. Do not scrape Luminary, Marriott, or Airbnb.

## Nolan — team lead

- Write the acceptance CSVs: one Luminary-website stay, one Airbnb stay, one inquiry, one cancelled stay, one Silver King table, one arrival in 2 days, one arrival in 10 days
- Hand-calculate Confirmed and Potential from those files and give Esmir the cents
- Load that fixture into the running desk and keep it there while the screen is built
- Check Esmir's API against the hand-calculated cents before Ryan builds on it
- Check Ryan's screen against the four questions: money, what's next, what needs a person, how the three ventures look
- Run the done-when list yourself and send each miss to the person who owns that file
- Keep the cents rules in next-steps.md. A wrong number is fixed in the API, then the screen
- Unlock Postgres, login, and the daily flash only after this slice passes

## Esmir — backend

- Add GET /api/v1/dashboard from the current bookings
- Confirmed = open confirmed and arrived stay totals. Potential = confirmed plus inquiries. Cancelled, completed, and no-show add nothing
- Gatherings returns zeros and stays collapsed
- Alerts only for confirmed arrivals inside 3 days, and tables seated today
- Timeline is open arrivals and seatings for 90 days, or 365 when horizon=12m
- Unknown venture returns 404
- Tests assert Nolan's cents, the 3-day alert, empty gatherings, and the 404
- Move booking routes to /api/v1/bookings and keep the old paths until Henry switches
- Tell Nolan when the versioned routes are ready
- No Postgres, login, or scraper in this slice

## Ryan — dashboard

- Build /dashboard from GET /api/v1/dashboard only. Do not recompute cents
- Header: Confirmed, Potential, the gap, next milestone, one alert. No third number
- Attention rail. If nothing is due, say so
- Cards for Rooms, Dining, and Gatherings. Gatherings stays visible at zero
- Timeline, 90 days, with a 12-month switch
- Venture switcher refetches the same page
- Phone stacks header, attention, cards, timeline. Desktop shows all four and the header stays put
- Failed load offers a retry. No sample dollars

## Henry — frontend

- Rooms filter: Luminary website, Airbnb, or all
- Restaurant filter by outlet
- If the desk cannot be reached, say so
- When Esmir is ready, point the forms at /api/v1/bookings
- Add a Dashboard link in the nav
- Do not put Confirmed or Potential on the collection pages

## Done when

- Nolan's fixture changes the dashboard numbers with no hand edit of the database
- The 2-day arrival is the milestone and an alert. The 10-day arrival is only on the timeline
- Gatherings is on the screen at zero
- The inquiry is in Potential and not in Confirmed
- The cancelled stay changes neither number
- Rooms, Restaurant, and Collect still create, import, update, and remove
- npm test and npm run lint pass
