# Stemworks ventures map

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Teammate map of what lives where. Read this before changing routes, tenants, or dashboard ports.

## Tenants never mix

| Tenant key | Who | Desk entry | Dashboard |
| --- | --- | --- | --- |
| `luminary` | Luminary Hotel & Co. | `/` | `?tenant=luminary` |
| `diaz_ventures` | Diaz Ventures LLC | `/jade` | `?tenant=diaz_ventures` |
| `pampered_soul` | The Pampered Soul | `/experiences` | `?tenant=pampered_soul` |

Confirmed and Potential on the founder board never sum across these tenants.

## What each desk is

```
Stemworks dashboard (/dashboard)
├── Luminary Hotel & Co.     → rentals + dining collection
├── Diaz Ventures LLC        → Jade Flowers product ops (other ventures quiet)
└── The Pampered Soul        → spa business desk (services, events, CRM)
```

### Luminary (`luminary`)

| Venture key | Module | Routes |
| --- | --- | --- |
| `rooms` | hotel | `/`, `/rooms`, `/import` |
| `dining` | hotel | `/restaurant` |
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
| Today (hub) | `/experiences` | — |
| Events / invites | `/experiences/events`, `/experiences/new`, `/experiences/[slug]` | `/e/{slug}` |
| Spa bookings | `/experiences/bookings`, `/experiences/calendar` | `/book` |
| Guests & CRM | `/experiences/guests`, `/experiences/crm`, `/experiences/scorecard` | — |
| Founder board | `/dashboard?tenant=pampered_soul` | — |

Contract: [pampered-soul.md](pampered-soul.md). Invite surfaces detail: [invite-page.md](invite-page.md). CRM/consent: [experiences-crm.md](experiences-crm.md).

Venture row in the database remains `pampered_events` (prefix `PS`) so existing data and codes stay stable. Display name is **The Pampered Soul**.

## Code ownership (who edits what)

| Path | Typical owner |
| --- | --- |
| `apps/web/lib/**`, `apps/web/prisma/**`, `apps/web/app/api/**` | Backend |
| `apps/web/app/dashboard/**`, `apps/web/components/dashboard/**` | Dashboard |
| `apps/web/app/{rooms,restaurant,import,page}/**`, desk forms | Frontend |
| Venture desks under `/jade` and `/experiences` | Shared by slice; follow module ports |

Dashboard UI must not import Prisma. Desk UI must not invent Confirmed/Potential cents.

## Where to read next

1. This file — orientation  
2. [README.md](../../README.md) — run the app  
3. [modules.md](modules.md) — aggregates and ports  
4. Venture contract for the desk you are changing  
