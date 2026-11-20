# Venture organizer (owner builder)

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Owners can create and shape ventures before (and alongside) the hard-coded desks. This is the first slice of self-serve venture organization.

## Who

- **Stemworks app owner** and **venture owner** roles can open `/organize`.
- Employees, customers, and vendors cannot.

## What owners configure

1. **Venture identity** — name, short name, type, status label.
2. **Board metrics** — ordered list dragged into place (Confirmed, Potential, Attention, Inventory, etc.).
3. **Features** — checkboxes for modules/capabilities (hotel, product, spa bookings, ticketed events, CRM, Connect, …).

## Live desk wiring

Checked features drive live routes and nav:

| Feature | Live surfaces |
| --- | --- |
| `hotel` | `/luminary/*` |
| `product` | `/jade/*` |
| `spa_bookings` | `/book`, `/thepamperedsoul/bookings` |
| `ticketed_events` | `/e/*`, events / guests / new under Pampered Soul |
| `crm_consent` | `/thepamperedsoul/crm`, scorecard |

Middleware redirects disabled paths to `/organize?disabled=1` (owners) or the role home. Shell and desk nav hide off features. Snapshot lives in the `stemworks_features` cookie (refreshed when blueprints or session change).

Linked seed blueprints (`bp_luminary`, `bp_jade`, `bp_pampered`) map to the three desks. Owner-created ventures without a link open a generic desk at `/v/{id}`.

## Persistence

Demo store: `apps/web/data/venture-blueprints.json` via `GET/POST /api/v1/venture-blueprints` and `PATCH/DELETE /api/v1/venture-blueprints/:id`.

Later this maps to kernel `subsidiaries` + `subsidiary_modules` and the dashboard port layout.

## Code

- Catalog + validation: `apps/web/lib/ventures/blueprint.ts`
- File store: `apps/web/lib/ventures/blueprint-store.ts`
- Feature → path/nav: `apps/web/lib/ventures/live-features.ts`
- UI: `apps/web/components/ventures/venture-organizer.tsx`
- Page: `apps/web/app/organize/page.tsx`
- Custom desk: `apps/web/app/v/[id]/page.tsx`
