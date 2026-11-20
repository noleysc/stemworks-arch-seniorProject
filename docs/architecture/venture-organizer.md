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

## Persistence

Demo store: `apps/web/data/venture-blueprints.json` via `GET/POST /api/v1/venture-blueprints` and `PATCH/DELETE /api/v1/venture-blueprints/:id`.

Later this maps to kernel `subsidiaries` + `subsidiary_modules` and the dashboard port layout. Enabling a feature does not yet flip live desk routes — that wiring is the next step.

## Code

- Catalog + validation: `apps/web/lib/ventures/blueprint.ts`
- File store: `apps/web/lib/ventures/blueprint-store.ts`
- UI: `apps/web/components/ventures/venture-organizer.tsx`
- Page: `apps/web/app/organize/page.tsx`
