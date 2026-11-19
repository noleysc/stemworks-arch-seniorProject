# Stemworks ventures map

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Teammate map of what lives where. Read this before changing routes, tenants, or dashboard ports.

## Three desks (split on purpose)

| Desk URL | Tenant | What it is |
| --- | --- | --- |
| `/luminary` | `luminary` | Luminary Hotel & Co. rentals + dining |
| `/jade` | `diaz_ventures` | Jade Flowers product ops |
| `/thepamperedsoul` | `pampered_soul` | Spa business desk (services, events, CRM) |

Hub at `/` only picks a desk. Founder board is `/dashboard?tenant=…`. Tenants never sum into each other.

Legacy redirects: `/experiences/*` → `/thepamperedsoul/*`, `/rooms` → `/luminary/rooms`, `/restaurant` → `/luminary/restaurant`, `/import` → `/luminary/import`.

## Tenants never mix

| Tenant key | Who | Desk entry | Dashboard |
| --- | --- | --- | --- |
| `luminary` | Luminary Hotel & Co. | `/luminary` | `?tenant=luminary` |
| `diaz_ventures` | Diaz Ventures LLC | `/jade` | `?tenant=diaz_ventures` |
| `pampered_soul` | The Pampered Soul | `/thepamperedsoul` | `?tenant=pampered_soul` |

### Luminary (`luminary`)

| Venture key | Module | Routes |
| --- | --- | --- |
| `rooms` | hotel | `/luminary`, `/luminary/rooms`, `/luminary/import` |
| `dining` | hotel | `/luminary/restaurant` |
| `gatherings` | hotel (quiet) | no collection yet |

Contract: [luminary.md](luminary.md). Stemworks does not replace Marriott PMS.

### Diaz Ventures (`diaz_ventures`)

| Venture key | Module | Routes |
| --- | --- | --- |
| `jade_flowers` | product | `/jade`, `/jade/materials`, `/jade/products`, `/jade/batches`, `/jade/orders` |
| `jade_experiences` | placeholder | — |
| `jade_haven` | placeholder | — |
| `stemworks` | placeholder | — |

Contract: [jade-flowers.md](jade-flowers.md).

### The Pampered Soul (`pampered_soul`)

This desk is a **business management dashboard for the spa**, not an events-only app. Ticketed events are one line of business inside it.

| Area | Owner routes | Public / guest |
| --- | --- | --- |
| Today (hub) | `/thepamperedsoul` | — |
| Events / invites | `/thepamperedsoul/events`, `/thepamperedsoul/new`, `/thepamperedsoul/[slug]` | `/e/{slug}` |
| Spa bookings | `/thepamperedsoul/bookings`, `/thepamperedsoul/calendar` | `/book` |
| Guests & CRM | `/thepamperedsoul/guests`, `/thepamperedsoul/crm`, `/thepamperedsoul/scorecard` | — |
| Founder board | `/dashboard?tenant=pampered_soul` | — |

Contract: [pampered-soul.md](pampered-soul.md). Invite surfaces detail: [invite-page.md](invite-page.md). CRM/consent: [experiences-crm.md](experiences-crm.md).

Venture row in the database remains `pampered_events` (prefix `PS`) so existing data and codes stay stable. Display name is **The Pampered Soul**. App folder is `apps/web/app/thepamperedsoul`. Domain code stays under `lib/experiences` and `/api/experiences`.

## Code ownership (who edits what)

| Path | Typical owner |
| --- | --- |
| `apps/web/lib/**`, `apps/web/prisma/**`, `apps/web/app/api/**` | Backend |
| `apps/web/app/dashboard/**`, `apps/web/components/dashboard/**` | Dashboard |
| `apps/web/app/luminary/**`, desk forms | Frontend |
| Venture desks under `/jade` and `/thepamperedsoul` | Shared by slice; follow module ports |

Dashboard UI must not import Prisma. Desk UI must not invent Confirmed/Potential cents.

## Where to read next

1. This file — orientation  
2. [README.md](../../README.md) — run the app  
3. [modules.md](modules.md) — aggregates and ports  
4. Venture contract for the desk you are changing  
