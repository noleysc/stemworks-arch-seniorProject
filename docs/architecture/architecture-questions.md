# Architecture questions — Event + CRM PRD

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Questions the team should settle before expanding the Experiences / CRM slice beyond the December 18 holiday pilot. They map the uploaded Event Management & Customer Relationship Platform PRD onto the Stemworks kernel. None of them invent a second product.

Companion: [experiences-crm.md](experiences-crm.md), [competitive-differentiation.md](competitive-differentiation.md), [modules.md](modules.md), [security.md](security.md).

## Tenancy and ownership

1. Who is the **organizing tenant** for the holiday event — Jade Haven (spa ops), Jade Experiences (event production), or a third business account that licenses Stemworks?
2. Are **participating vendors** (Jade Flowers, charcuterie, floral) separate tenants, ventures under Diaz Ventures, or guest accounts with scoped access to one event only?
3. Does a vendor who only sells at the event get a full private CRM, or a **read-only authorized contact list** until they become a paying tenant?
4. When the spa later licenses Stemworks commercially, does the pilot data stay on `diaz_ventures`, or migrate into a **new spa tenant** with export/import?

## Hybrid customer database

5. Is the **shared customer network** a platform-wide identity (`GuestProfile`) that can opt into many businesses, or only a preference center with no searchable directory?
6. What is the **minimum PII** a private business CRM may store from an RSVP when the guest opts in: name + email, phone, dietary notes, attendance history?
7. If a guest opts into the spa but not Jade Flowers, may Jade Flowers still see that guest on the **event guest list** for operational check-in, without contact fields?
8. Who owns the right to **export** a guest row — the organizer, each opted-in business, the guest, or all three with different columns?
9. What happens to CRM rows when a guest **revokes** consent — soft-archive with audit, hard delete of contact channels, or retain attendance anonymized?

## Consent and communications

10. Is per-vendor marketing consent **granular by channel** (email vs SMS) in Phase 2, or one marketing boolean per business for the pilot? (Pilot: one marketing checkbox = email consent.)
11. Does buying a ticket or checking in imply marketing consent? (**No.** Only the vendor checkbox does.)
12. Where do confirmation and reminder messages send from — Stemworks (Resend / Twilio), the organizer's own ESP, or both with consent copied?
13. How do we prove TCPA / CAN-SPAM compliance in an audit: consent timestamp, IP/user-agent, copy of the disclosure text, and revoke events?

## Roles and event operations

14. Is **Event staff** allowed to see full guest contact info, or only name + RSVP status + check-in?
15. Can a **Vendor** role check guests in, or only view their own opted-in CRM list and booth tasks?
16. For capacity: is the limit **per event**, per ticket tier, or per time slot (spa appointments during the holiday experience)?
17. Are spa **appointment bookings** during the event owned by `hospitality` / ops, or attached as line items on the event registration?

## Money and modules

18. Stripe Connect timing: keep mock `paymentRef` through Dec 18, or wire live charges before the holiday event?
19. Do event expenses and vendor fees live on an **edition P&L** (`event-production`) or on a simpler pilot expense ledger?
20. Confirmed is paid ticket revenue. Is Potential remaining capacity × GA price acceptable for the pilot, or should it be unpaid holds only?

## Boundaries with existing Stemworks modules

21. Is the holiday experience an `event-production` **edition**, an `atelier`-style one-off session, or a new `experiences` surface that later feeds both?
22. Candle Atelier stays on Jade Flowers. Does a guest who attends Atelier and later the holiday event share one `GuestProfile`, two CRM rows, or neither until they opt into the network?
23. Luminary Gatherings already has sessions. Confirm the Experiences desk **never** writes Luminary tables and never appears on the Luminary tenant board.

## Pilot success and product bets

24. Which PoC metrics are gates for commercial proof: registration conversion, check-in completion, **per-vendor opt-in rate**, follow-up delivery, repeat booking?
25. What competitor workflow are we refusing to copy — Eventbrite's organizer-owns-all-contacts, Partiful's social-only RSVP, Square's appointment CRM without multi-vendor events?
26. After December 18, is the next build spa appointments, recurring cultural series, or vendor marketplace — and which question above blocks that choice?
