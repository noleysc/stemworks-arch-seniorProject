Team 18: Nolan Stilwell-Carroll, Esmir Ramirez Fulcar, Henry Ramirez, Ryan Lorentzen  
Project: STEMWORKS Dashboard for JadeFlowers  
Part 5: Workflow Timeline  
CEN 4934

## Methodology & Workflow Description

The Stemworks development team will use an Iterative Slice Agile methodology. Rather than executing rigid, sequential Waterfall phases where integration is deferred until the end of the lifecycle, the project is broken down into contained operational "slices" (Ex: Rentals Collection, Command Dashboard, Jade Flowers Product Desk, and The Pampered Soul Experiences & CRM) that integrate into a unified operating board through isolated modules.

## Team Roster & Architectural Ownership

- **Nolan (Team Lead):** Owns architectural governance and slice acceptance verification.
- **Henry (Backend):** Owns Prisma schemas, SQLite/Supabase persistence, and Next.js API route handlers.
- **Esmir (Dashboard Integration):** Owns the four-zone multi-tenant command board, client state management, and financial formatting.
- **Ryan (Frontend):** Owns data-ingestion interfaces, forms, client side filtering boards, and primary navigation.

## Engineering Guardrails & Quality Gates

- **Strict Separation of Concerns:** Frontend and Dashboard layers are prohibited from importing Prisma or computing financial totals client-side; Backend is prohibited from importing UI components. Exceptions are made when given permission from the owner. For example Ryan (frontend) can modify Supabase if given explicit approval from Henry (backend).
- **Peer Code Reviews:** All committed code by one member is reviewed by a different predetermined member. For example, Ryan will review and approve Henry’s pull requests and vice versa.
- **Blocking Gates & Automated Verification:** Downstream UI work is gated behind verified JSON contract fixtures, and no slice passes acceptance until automated unit tests (`npm test`) and linting (`npm run lint`) pass with zero errors.

## Schedule Adaptability

This workflow timeline represents an initial baseline draft. Sprint durations, slice prioritization, and post-MVP milestones will be iteratively modified throughout the semester as additional stakeholder information is gathered and experience is gained through the initial development phases.

## Timeline

| Sprint | Window (draft) | Slice focus | Desired minimum viable product |
| --- | --- | --- | --- |
| Sprint 0 | Weeks 1–2 | Architecture foundation | Architecture docs, module boundaries, GitHub repo, stack decisions recorded |
| Sprint 1 | Weeks 3–4 | Rentals collection | Working desk for room/restaurant bookings and CSV import; money in integer cents; SQLite |
| Sprint 2 | Weeks 5–6 | Command dashboard | `GET /api/v1/dashboard` + `/dashboard` with Confirmed/Potential, attention, venture cards, tenant switcher |
| Sprint 3 | Weeks 7–8 | Jade Flowers product desk | Materials, purchases, SKUs/orders on `/jade`; batch pours of 6 or 10, release to inventory, recall by batch code |
| Sprint 4 | Weeks 9–10 | Pampered Soul experiences | Owner invite creator vs guest `/e/[slug]` checkout, ticket tiers, demo/Stripe payment, per-vendor marketing consent |
| Sprint 5 | Weeks 11–12 | Booking, calendar, polish | Client `/book`, owner calendar of events and booked clients, dashboard to-dos, free ($0) tickets without card fields |
| Sprint 6 | Weeks 13–14 | Delivery hardening | Supabase Postgres cutover path, auth/RLS plan, partner demo script and runbook on Vercel-ready build |

Sprints 1–5 already have working evidence on GitHub `main` (rentals desk through free-ticket checkout). Sprint 6 remains the delivery-focused closeout and may shift if the sponsor prioritizes a different venture next.

## Pampered Soul commercial cutover (conditional)

Separately from the semester sprint table, The Pampered Soul has a proposed MassageBook replacement schedule targeting readiness on **December 11, 2026** and commercial launch on **December 12, 2026**. That plan is conditional on the Nov 30 walkthrough and Dec 1 gap assessment. Full checklist, dependencies, contingency, and current-app baseline: [pampered-soul-massagebook-launch.md](pampered-soul-massagebook-launch.md).
