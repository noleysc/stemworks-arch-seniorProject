# Stemworks

Stemworks is a multi-tenant operating dashboard owned by Diaz Ventures LLC. Ventures plug into one board through module ports. Tenants never sum into each other.

Running slices in `apps/web`:

- **Dashboard** — `/dashboard` — tenant switcher, Confirmed / Potential, attention, venture cards, timeline
- **Luminary Desk** — `/` — rental aggregate for Luminary Hotel & Co. (website + Airbnb + later sources)
- **Jade Flowers** — `/jade` — product materials, SKUs, and orders on the Diaz Ventures tenant

The architecture documents below still govern what gets built next.

## Read this

Start with [docs/architecture/README.md](docs/architecture/README.md). It is the map: what must stay a separate module, how the process is shaped, and what is built first.

| Document | What it settles |
| --- | --- |
| [docs/architecture/README.md](docs/architecture/README.md) | Boundaries, shape, phase gates |
| [docs/architecture/luminary.md](docs/architecture/luminary.md) | Luminary Hotel & Co. property contract |
| [docs/architecture/jade-flowers.md](docs/architecture/jade-flowers.md) | Jade Flowers product slice on Diaz Ventures |
| [docs/architecture/modules.md](docs/architecture/modules.md) | Aggregates, ports, which venture enables which module |
| [docs/architecture/security.md](docs/architecture/security.md) | Authentication, row-level security, ledger, secrets, CI |
| [docs/architecture/dashboard.md](docs/architecture/dashboard.md) | The four zones and where Phase 1 numbers come from |
| [docs/architecture/spec-gaps.md](docs/architecture/spec-gaps.md) | Spec omissions and the decision recorded for each |
| [docs/team/next-steps.md](docs/team/next-steps.md) | Next slice for frontend, backend, and dashboard |
| [docs/team/TODO.md](docs/team/TODO.md) | To-do list for Nolan, Esmir, Ryan, and Henry |

The sources reconciled here are the Technical Specification v1.0 (April 2026), the Dashboard Specification, and the Native Module Client Definitions. Where those documents disagree on calendar phase, the architecture isolates the module and does not invent a schedule.

## Run the desks

```bash
cd apps/web
npm install
npx prisma db push
npm run dev
```

The app listens on port 43123.

| URL | What it is |
| --- | --- |
| `/dashboard` | Scalable command board. `?tenant=luminary` or `?tenant=diaz_ventures` |
| `/` | Luminary rental desk |
| `/jade` | Jade Flowers product desk |

Candle Atelier, Event Production, Jade Haven pipeline, Postgres RLS, and live Craftybase / Marriott adapters are later slices. Stemworks does not replace the hotel's property management system.

Copyright Diaz Ventures LLC. All rights reserved. See [LICENSE](LICENSE).
