# Stemworks

Stemworks is a multi-tenant operating dashboard owned by Diaz Ventures LLC. Ventures plug into one board through module ports. Tenants never sum into each other.

## Roles (dashboard shell)

The web app uses a dashboard shell with a demo role switcher (cookie until real login):

| Role | Home | What they see |
| --- | --- | --- |
| Owner | `/dashboard` | Command board + all desks |
| Employee | `/dashboard` | Floor ops (schedule, check-in, bookings) |
| Customer | `/portal` | Book services + buy tickets |
| Vendor | `/vendor` | Participating events + opt-ins |

Details: [docs/architecture/roles-frontend.md](docs/architecture/roles-frontend.md).

## Ventures (teammate map)

Start with [docs/architecture/ventures.md](docs/architecture/ventures.md). Short version:

| Tenant | Desk | What it is |
| --- | --- | --- |
| Luminary Hotel & Co. | `/luminary` | Rentals + dining collection |
| Diaz Ventures LLC | `/jade` | Jade Flowers product ops (materials, batches, orders) |
| The Pampered Soul | `/thepamperedsoul` | Spa **business desk** — services, schedule, CRM, and ticketed events |

`/` is only the desk picker. The three desks stay separate. Pampered Soul events live under `/thepamperedsoul/events`. Details: [docs/architecture/pampered-soul.md](docs/architecture/pampered-soul.md).

### Pampered Soul error handling

Pampered Soul business rules use `PublicError` from `apps/web/lib/experiences/errors.ts` for deliberately user-facing messages. Its API handlers use `errorResponse` to translate validation, database, and payment failures without returning raw diagnostics. Client forms use the generic `requestJson` / `requestErrorMessage` helpers in `apps/web/lib/http.ts`; only API messages explicitly marked `publicError: true` are displayed. Unexpected failures use action-specific fallbacks. Keep diagnostic codes on the server without logging guest contacts, card data, or secrets. Payment failures must not claim that no charge occurred or automatically resubmit a purchase. Page-loading error boundaries cover the owner desk, public invites, and service bookings.

## Read this

| Document | What it settles |
| --- | --- |
| [docs/architecture/ventures.md](docs/architecture/ventures.md) | Tenants, desks, routes for teammates |
| [docs/architecture/README.md](docs/architecture/README.md) | Boundaries, shape, phase gates |
| [docs/architecture/luminary.md](docs/architecture/luminary.md) | Luminary Hotel & Co. property contract |
| [docs/architecture/jade-flowers.md](docs/architecture/jade-flowers.md) | Jade Flowers product slice |
| [docs/architecture/pampered-soul.md](docs/architecture/pampered-soul.md) | Pampered Soul spa business desk |
| [docs/architecture/invite-page.md](docs/architecture/invite-page.md) | Owner planner vs guest invite |
| [docs/architecture/experiences-crm.md](docs/architecture/experiences-crm.md) | Consent + CRM rules |
| [docs/architecture/modules.md](docs/architecture/modules.md) | Aggregates and ports |
| [docs/architecture/dashboard.md](docs/architecture/dashboard.md) | Founder board zones |
| [docs/architecture/security.md](docs/architecture/security.md) | Auth, RLS, secrets |
| [docs/architecture/supabase.md](docs/architecture/supabase.md) | Hosted Postgres wiring |
| [docs/team/TODO.md](docs/team/TODO.md) | Nolan, Esmir, Ryan, Henry tasks |

## Run the desks

```bash
cd apps/web
npm install
npx prisma db push
npm run dev
```

Open **http://localhost:43123**

| URL | What it is |
| --- | --- |
| `/` | Desk picker (Luminary · Jade · The Pampered Soul) |
| `/dashboard` | Founder board (`?tenant=luminary`, `diaz_ventures`, or `pampered_soul`) |
| `/luminary` | Luminary rentals desk |
| `/luminary/rooms` | Rental list |
| `/luminary/restaurant` | Dining reservations |
| `/jade` | Jade Flowers product desk |
| `/jade/products` | Finished goods + pour a batch of 6 or 10 |
| `/jade/batches` | Batch release to inventory and recall tracking |
| `/thepamperedsoul` | Pampered Soul business hub |
| `/thepamperedsoul/events` | Ticketed invites |
| `/thepamperedsoul/calendar` | Schedule |
| `/thepamperedsoul/bookings` | Spa appointments |
| `/book` | Client books one spa service |
| `/e/{slug}` | Guest ticket checkout only |

### Pampered Soul demo

1. Open `/thepamperedsoul` — business hub.
2. Create an invite under Events (`/thepamperedsoul/new`), publish, open `/e/{slug}`.
3. Paid demo card: `4242 4242 4242 4242` (or use a $0 tier — no card fields).
4. Book a service at `/book`; see it on Calendar and Bookings.

## Supabase

Cloud project: [kcskzamqbpzxlfpqisib](https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib). Wiring notes: [docs/architecture/supabase.md](docs/architecture/supabase.md). Local desks still use SQLite until Postgres cutover.

Candle Atelier, Jade Experiences series, Jade Haven pipeline, Postgres RLS, and live Craftybase / Marriott adapters are later slices. Stemworks does not replace the hotel property management system.

Copyright Diaz Ventures LLC. All rights reserved. See [LICENSE](LICENSE).
