Team 18: Nolan Stilwell-Carroll, Esmir Ramirez Fulcar, Henry Ramirez, Ryan Lorentzen  
Project: STEMWORKS Dashboard for JadeFlowers  
Part 4: New Technologies  
CEN 4934

**Ryan:** I am familiar with all of the frontend technologies we are using since I have done frontend on many projects in the past. I am slightly unfamiliar with Supabase, as I have only used it for a small portion of a personal project. In order to familiarize myself I will be communicating with Henry (backend developer) to learn about how he is setting it up and how to use it/make changes if I need to.

**Nolan:** As team lead I am responsible for the architecture documents, slice acceptance, and partner alignment. Several pieces of this stack are new to me as a combined platform—especially multi-tenant dashboard ports, Prisma schema evolution across ventures, and Supabase as the hosted Postgres target. My plan for familiarization is to keep `docs/architecture/` current, walk each accepted slice against fixtures and `npm test`, and pair with Henry and Esmir when schema or dashboard contracts change so acceptance stays tied to what the team actually ships on GitHub.

**Esmir:** I focus on the multi-tenant command board and how Confirmed / Potential, attention, and venture cards are rendered from the dashboard API. Next.js App Router patterns and the port-based dashboard contract are newer to me than general React work. I will familiarize myself by implementing against verified JSON fixtures from Nolan, reviewing Henry’s API responses before building UI state, and using the live `/dashboard` desks plus peer review with Ryan to confirm formatting and tenant switching behave correctly.

**Henry:** I own Prisma schemas, SQLite/Supabase persistence, and Next.js API route handlers. Prisma migrations toward Supabase Postgres, Stripe demo vs live payment paths, and module-isolated tables (rentals, Jade batches, Pampered Soul registrations) are the areas I am deepening. My plan is to use Prisma docs and our in-repo schema as the source of truth, practice `db push` / generate locally before each schema change, and walk Ryan and Esmir through any Supabase or API contract updates before they depend on them.

Ryan has a lot of experience with frontend design, so he will be focusing on the frontend, making sure it is easy to use for both the business owner and any customers who will be interacting with the system. Henry will handle backend persistence and APIs so financial totals and inventory rules stay server-side. Esmir will integrate those payloads into the founder dashboard. Nolan will gate each slice on architecture rules, tests, and partner-facing acceptance so the desks on GitHub `main` stay coherent as Jade Flowers, Pampered Soul, and rentals continue to expand.
