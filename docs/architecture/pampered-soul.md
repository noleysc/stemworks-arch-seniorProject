# The Pampered Soul — business desk

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

The Pampered Soul desk is a **spa business management dashboard**. Ticketed events are part of that business. They are not the whole product.

Tenant: `pampered_soul`. Database venture key: `pampered_events` (kept for stable prefixes and existing rows). Display name: **The Pampered Soul**.

## What the desk covers

| Area | What the owner does | Routes |
| --- | --- | --- |
| Today | See open invites, upcoming bookings, and shortcuts | `/thepamperedsoul` |
| Events | Create and publish ticketed invites | `/thepamperedsoul/events`, `/thepamperedsoul/new`, `/thepamperedsoul/[slug]` |
| Schedule | Month view of invites, spa bookings, and guests | `/thepamperedsoul/calendar` |
| Spa services | Individual appointments booked by clients or staff | `/thepamperedsoul/bookings`, public `/book` |
| Spa clients | Preferences, staff notes, appointment history | `/thepamperedsoul/clients` |
| Guests | Check-in for ticketed nights | `/thepamperedsoul/guests` |
| CRM | Consented marketing contacts only | `/thepamperedsoul/crm` |
| Scorecard | Spa appointment financials plus ticket revenue / consent | `/thepamperedsoul/scorecard` |
| Dashboard | Founder board for this tenant | `/dashboard?tenant=pampered_soul` |

Guest surfaces stay chrome-free:

| Surface | Route |
| --- | --- |
| Ticket checkout | `/e/{slug}` |
| Book one spa service | `/book` |

## How this differs from “events only”

- Owners land on a **business hub**, not only an invite list.
- Spa bookings and calendar sit beside invites.
- CRM and scorecard are spa-business tools that also serve event nights.
- The founder dashboard shows Pampered Soul as its own tenant, never mixed into Luminary or Diaz Ventures totals.

## MassageBook replacement

Commercial cutover plan (readiness Dec 11, launch Dec 12, 2026): [../team/pampered-soul-massagebook-launch.md](../team/pampered-soul-massagebook-launch.md). Deadline prep (walkthrough agenda, gap matrix, Dec 1 decision pack): [../team/pampered-soul-deadline-prep.md](../team/pampered-soul-deadline-prep.md). That schedule is conditional on the Nov 30 walkthrough and Dec 1 gap assessment. MassageBook stays active until required workflows are accepted and data is reconciled.

## Related docs

- Teammate map of all ventures: [ventures.md](ventures.md)
- Invite creator vs guest invite: [invite-page.md](invite-page.md)
- Consent and CRM rules: [experiences-crm.md](experiences-crm.md)
- MassageBook replacement & launch timeline: [../team/pampered-soul-massagebook-launch.md](../team/pampered-soul-massagebook-launch.md)
