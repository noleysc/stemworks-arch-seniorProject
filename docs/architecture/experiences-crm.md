# Experiences + CRM — PRD mapped to Stemworks

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Source: Event Management & Customer Relationship Platform PRD v1.0 (Nov–Dec 2026), initial pilot Spa Operations + December 18 Holiday Experience. This document places that PRD inside the Stemworks modular monolith. It does not replace [modules.md](modules.md) or [security.md](security.md).

Questions that remain open: [architecture-questions.md](architecture-questions.md). Competitive posture: [competitive-differentiation.md](competitive-differentiation.md).

## Where it sits

| PRD concept | Stemworks home |
| --- | --- |
| Business account | `Tenant` + ventures (`Venture`) |
| Event management | Owner desk on **The Pampered Soul** (`pampered_events`, pilot tables in `apps/web`) |
| Public invite UX | Separate guest page at `/e/{slug}` — no planner chrome; host invite, guest wall, ticket checkout |
| Ticketing | `TicketTier` + paid `EventRegistration` (`amountPaidCents`, confirmation code) |
| Private business CRM | `BusinessCrmContact` scoped by `ventureId` / business key |
| Shared customer network | Optional `GuestProfile` + preference / revoke flows |
| Cross-business opt-in | `VendorConsent` with `channelScope = marketing` — checkbox **is** marketing consent |
| Communications | Confirmations / reminders later via Connect + Resend; marketing sends require consent |
| Spa operations | Pampered Soul spa menu (`SPA_SERVICES`) as planner-selected itinerary copy. MassageBook stays outside. |
| Analytics / PoC metrics | Ticket revenue + guest wall + consent scorecard + dashboard port |

Luminary Gatherings stays on the `hotel` module. Experiences never writes Luminary booking tables.

**Consent rule.** Buying a ticket shares operational details with the organizer. A vendor checkbox grants that business marketing consent. Check-in never grants consent.

## Pilot seed

- Tenant: `pampered_soul`
- Organizer venture: `pampered_events` (prefix `PS`)
- Events are owner-authored (no canned Jade Haven holiday seed)
- Public RSVP: `/e/{slug}` (guest view)
- Operator desk: `/experiences` (planner view)

## Data rules

1. Ticket purchase creates a confirmed `EventRegistration` with tier, quantity, `amountPaidCents`, and confirmation code.
2. Guests may appear on the public “Who's going” wall (first name + optional note).
3. Each vendor marketing checkbox creates `VendorConsent` (`channelScope = marketing`) and, only then, a `BusinessCrmContact`.
4. Revokes append `ConsentAudit` and strip contact channels on that business CRM row.
5. Check-in updates attendance only. It never grants marketing consent.
6. Money is integer cents. Pilot checkout writes a mock `paymentRef`; Stripe replaces the charge later without changing the registration shape.

## Dashboard port

`GET /api/v1/dashboard?tenant=diaz_ventures` composes Jade Experiences through the experiences port:

- Confirmed: sum of `amountPaidCents` on active ticketed registrations
- Potential: confirmed plus remaining capacity valued at GA list price (pilot signal)
- Open count: tickets sold
- Attention: event within 3 days, or marketing-consent follow-up queue after the event
- Status label: tickets sold · marketing consents

## Phase alignment

| PRD phase | Stemworks action |
| --- | --- |
| Phase 1 foundation | Accounts via existing tenants, event create, landing page, RSVP, guest DB, basic CRM profiles, per-vendor consent |
| Phase 2 operational MVP | Check-in, consent management UI, vendor list, basic scorecard |
| Phase 3 live Dec 18 | Freeze untested features; operate on this desk |
| Phase 4 evaluation | Export scorecard metrics into the commercial PoC report |

Auth, Postgres RLS, and SMS/email providers remain on the same gates as the rest of Stemworks.
