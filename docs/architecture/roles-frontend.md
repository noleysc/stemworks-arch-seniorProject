# Frontend roles (demo shell)

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

The Stemworks web desk ships a **dashboard-like shell** with four demo roles **per venture**. Luminary, Jade Flowers, and The Pampered Soul each keep their own owner, employees, customers, and vendors. Real auth (JWT, refresh cookies, RLS) is still the architecture target in [security.md](security.md). Until that lands, the shell uses a `stemworks_session` cookie (with legacy `stemworks_role` kept in sync) so teammates can preview each surface.

## Session shape

```json
{
  "activeVenture": "pampered_soul",
  "roles": {
    "luminary": "owner",
    "diaz_ventures": "employee",
    "pampered_soul": "vendor"
  }
}
```

Switching venture loads that venture’s stored role. Switching role updates only the active venture.

## Roles (within one venture)

| UI role | Kernel hint | Home | Sees |
| --- | --- | --- | --- |
| Owner | `owner` | `/dashboard?tenant=…` for that venture | That venture’s command board + desk |
| Employee | `manager` / `associate` | Venture desk (`/luminary`, `/jade`, `/thepamperedsoul`) | Floor ops for that venture only — no parent P&L |
| Customer | `client` | `/portal?venture=…` | That venture’s guest/shopper surface |
| Vendor | partner | `/vendor?venture=…` | That venture’s partner desk (Pampered demo: Jade Haven) |

Demo personas differ by venture (e.g. Luminary owner Alex Rivera vs Pampered owner Morgan Spa).

## Rules

- Guest checkout `/e/{slug}` and `/book` stay chrome-free and belong to Pampered Soul.
- Middleware redirects a role away from paths outside its active venture.
- Opening a desk from `/` posts the venture switch, then navigates.
- Hiding a nav item is not authorization — API handlers must still enforce roles when auth ships.
- Pampered Soul vendor demo defaults to Jade Haven (`jade_haven`).

## Code

- Venture map: `apps/web/lib/auth/ventures.ts`
- Role map: `apps/web/lib/auth/roles.ts`
- Cookie session: `apps/web/lib/auth/session.ts`
- Switcher API: `POST /api/v1/session/role` with `{ role?, venture? }`
- Shell: `apps/web/components/shell/app-shell.tsx`
