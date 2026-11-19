# Frontend roles (demo shell)

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

The Stemworks web desk ships a **dashboard-like shell** with four demo roles. Real auth (JWT, refresh cookies, RLS) is still the architecture target in [security.md](security.md). Until that lands, the shell uses a `stemworks_role` cookie so teammates can preview each surface.

## Roles

| UI role | Kernel hint | Home | Sees |
| --- | --- | --- | --- |
| Owner | `owner` | `/dashboard` | Command board, all desks, money |
| Employee | `manager` / `associate` | `/dashboard` | Schedule, check-in, bookings, batches — no parent P&L |
| Customer | `client` | `/portal` | Book services, buy tickets, own confirmations |
| Vendor | event participant | `/vendor` | Participating events + marketing opt-ins only |

## Rules

- Guest checkout `/e/{slug}` and `/book` stay chrome-free.
- Middleware redirects a role away from paths it cannot use.
- Hiding a nav item is not authorization — API handlers must still enforce roles when auth ships.
- Vendor demo defaults to Jade Haven (`jade_haven`) as the participating business.

## Code

- Role map: `apps/web/lib/auth/roles.ts`
- Cookie session: `apps/web/lib/auth/session.ts`
- Switcher API: `POST /api/v1/session/role`
- Shell: `apps/web/components/shell/app-shell.tsx`
