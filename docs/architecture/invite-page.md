# Invite page architecture — The Pampered Soul

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Two surfaces, two jobs:

| Surface | Who | Route |
| --- | --- | --- |
| **Ticketed invite creator** | Pampered Soul owner | `/experiences`, `/experiences/new`, `/experiences/[slug]` |
| **Guest checkout invite** | Anyone with the share link | `/e/{slug}` |

They do not share chrome. Creator nav, CRM, scorecard, and edit controls stay on `/experiences/*`. The public invite has no planner header and is read-only except ticket checkout.

The owner product is a **ticketed invite creator**: compose invite copy, set ticket tiers, optionally attach spa-menu treatments, publish, share `/e/{slug}`. UX for guests is modeled on Partiful. Tickets, marketing consent, and private CRM follow [experiences-crm.md](experiences-crm.md).

## Who hosts

| Role | Who |
| --- | --- |
| Organizing tenant | **The Pampered Soul** (`tenant.key = pampered_soul`) |
| Owner / event planner | Pampered Soul owner. They fill in the event. |
| Public guests | Anyone with the invite link |
| Vendors | Optional participants the owner adds. Never the host by default. |

Jade Flowers, Jade Haven, and Jade Experiences **do not host** this invite.

## Ticketed invite creator

The owner creates a ticketed invite. Stemworks does not seed a holiday spa night.

Owner fills, in order:

1. **Invite fields** — title, summary, date, time label, location (default `16313 S Tamiami Trail, Fort Myers, FL 33908`), capacity, host display name (default `The Pampered Soul`)
2. **Ticket tiers** — at least one before publish (required product of the creator)
3. **Spa menu** — optional. Owner picks live Pampered Soul treatments from `SPA_SERVICES`. Each pick becomes an `EventItineraryItem` with `serviceKey`, duration, and menu price.
4. **Custom itinerary** — optional moments the menu does not cover.
5. **Participating businesses** — optional marketing-consent checkboxes
6. **Publish** — `draft` → `open` unlocks `/e/{slug}` and the shareable guest link

Draft invites are not publicly reachable. Guests hitting a draft or missing slug get 404.

## Guest page composition

1. Poster hero — host, title, summary, when/where, going count
2. Spa menu — treatments the owner added
3. Itinerary — timed blocks
4. Who is going — first-name wall
5. Participating businesses
6. Get tickets — tiers, email, phone, card, per-vendor marketing consent

Buying a ticket is not marketing consent. A vendor checkbox is.

## Planner surfaces

| Route | Job |
| --- | --- |
| `/experiences` | Invite list + share link |
| `/experiences/new` | Create ticketed invite (copy, tiers, spa menu) |
| `/experiences/[slug]` | Edit invite copy and tiers, publish / unpublish / cancel, copy guest link |
| `/experiences/[slug]/preview` | Owner preview of the guest invite (drafts included; checkout locked) |
| `/experiences/calendar` | Month calendar: invites, service bookings, ticketed guests |
| `/experiences/bookings` | Individual spa appointments booked at `/book` |
| `/experiences/guests` | Check-in |
| `/experiences/crm` | Consented contacts |
| `/experiences/scorecard` | Revenue + consent |
| `/book` | Public client booking for one spa service |
| `/e/{slug}` | Public ticketed invite / checkout only |

## Recorded decisions

1. Organizing tenant is The Pampered Soul.
2. Events are owner-authored.
3. Planner and guest invite are separate views with separate layouts.
4. Publish requires at least one ticket tier.
5. Spa-menu rows are display copy; they do not book MassageBook.
