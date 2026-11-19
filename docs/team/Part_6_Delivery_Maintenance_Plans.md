Team 18: Nolan Stilwell-Carroll, Esmir Ramirez Fulcar, Henry Ramirez, Ryan Lorentzen  
Project: STEMWORKS Dashboard for JadeFlowers  
Part 6: Delivery/Maintenance Plans  
CEN 4934

## Hosting

The Stemworks dashboard is being developed for several small businesses at a time such as The Pampered Soul Spa, Jade Flowers, and the Luminary Hotel. As a result, deployment and integration will vary depending on the requirements of the specific business. The final project is expected to be hosted as a web-app so that business owners can access their respective dashboard at any time. The final deliverable web-app will be accessible through Vercel with a custom domain. Additionally, each business’ data will be stored on Supabase, which will be linked directly to the web-app. This setup was chosen because it allows for businesses to utilize our system without the need to host it locally or set it up for themselves. During development, the team continues to run the app locally (`npm run dev` on port 43123) with SQLite, while the GitHub repository (`noleysc/stemworks-arch-seniorProject`) remains the source of truth for code and architecture docs. The Supabase project `stemworks-dev` is already wired in-repo for the Postgres cutover path.

## Integration

Each business’ dashboard will be integrated with their existing systems depending on their expectations and desired use cases of the dashboard.

- **The Pampered Soul Spa:** Ticketed invite creator for owners (`/thepamperedsoul`) and guest checkout (`/e/[slug]`) with optional Stripe or demo card payment; free ($0) tickets skip payment fields. Individual service booking at `/book`, owner calendar of events and booked clients, guest check-in, private CRM with per-vendor marketing consent, and scorecard views. Guests use shared links—no install on their devices.
- **The Luminary Hotel:** Rental and restaurant collection desks fed by manual entry and CSV import from existing booking channels (website, Airbnb, and later sources). Stemworks aggregates counts and cents for the founder board and does not replace Marriott property management, keys, or folios.
- **Jade Flowers:** Product operations desk for materials and purchase receipts, finished goods (products/SKUs), orders, and batch tracking (pour sizes 6 or 10, release into inventory, recall by batch code so related units stay linked). Future Connect adapters (for example Craftybase, Square, or Shopify) remain ports and are not required for the first delivered slice.

## Maintenance & Handoff

After the semester deliverable, maintenance ownership transfers to Diaz Ventures / the industry sponsor. The handoff package includes:

1. **Source code** on GitHub `main`, with architecture documents describing tenant isolation, module boundaries, and money-in-cents rules.
2. **Environment configuration** via `.env.example` and hosting dashboards (Vercel for the web app; Supabase for database keys)—secrets are not stored in git.
3. **Runbook** for the three desks: rentals collection, Jade materials → batch → recall, and Pampered Soul invite publish → guest checkout.
4. **Operational support path:** GitHub issues for defects and enhancements; production monitoring through Vercel and Supabase once live.

The student team will complete a final demonstration and documentation pass. Ongoing feature work after handoff is the sponsor’s backlog. Significant technology changes after delivery should still follow the same rule used in development: discuss with the team and sponsor before replacing core stack choices (Next.js, Prisma, Supabase, Vercel).
