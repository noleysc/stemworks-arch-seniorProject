# Competitive differentiation — Experiences + CRM

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

How Stemworks Experiences differs from tools organizers already know. Ship these as product rules, not marketing copy.

## UX model: Partiful

**Model the invite after Partiful.** Social proof, first-name guest wall, light ticket purchase, shareable link, host-forward branding. Guests should feel invited, not onboarded into enterprise software.

What we take from Partiful:

- Invite-first public page (`/e/{slug}`)
- “Who's going” wall (first name + optional note)
- Fast ticket / RSVP checkout
- Host name as the hero signal

What we add beyond Partiful:

- Paid ticket tiers with inventory
- Per-vendor **marketing consent** (checkbox = consent)
- Private business CRM handoff only when consented
- Consent audit + revoke
- Operator scorecard for revenue and consent

## Competitor map

| Tool | Strength | Gap Stemworks fills |
| --- | --- | --- |
| Partiful | Social invites, guest wall, casual RSVP | Thin on paid multi-tier tickets, business CRM, multi-vendor marketing consent |
| Eventbrite | Public ticketing, discovery, check-in | Organizer owns the contact list. Weak multi-vendor consent. Heavy vs social invite |
| HoneyBook | Proposals, contracts, payments for service businesses | Not an attendee invite + ticket wall |
| Square Appointments | Spa/salon booking and client book | Appointments only. No multi-business event invite |
| HubSpot / Salesforce | Full CRM | Heavy. Not event-native. No “ticket ≠ marketing consent” |

## Product rules

### 1. Opt-in grants marketing consent

Checking a vendor box on the invite **is** marketing consent for that business (email). Ticket purchase and check-in are not consent. Disclosure text must say so.

### 2. One ticket ≠ every vendor may market

Each participating business has its own checkbox, default off. Declining still allows operational guest-list presence for the organizer.

### 3. Sell tickets

Early bird / GA / VIP (or equivalent) with quantity, confirmation codes, and revenue on the scorecard. Stripe replaces the pilot mock charge later; the registration already stores `amountPaidCents` and `paymentRef`.

### 4. Hybrid private CRM

`BusinessCrmContact` rows appear only after marketing consent. Vendors see names for ops; email/phone only when consented.

### 5. Consent audit trail

Grant, decline, and revoke write append-only audits with disclosure snapshot.

## Deliberately not copied

- Eventbrite marketplace discovery as the acquisition engine.
- Replacing Square or Marriott for day-to-day appointments / PMS.
- Cross-business lookalike audiences or shared lead pools.
- Making the invite feel like a CRM form.

## Pilot proof (December 18)

Measure ticket conversion, guest-wall participation, check-in completion, and per-vendor marketing consent rate. If staff export the full list for marketing, the differentiator failed operationally.
