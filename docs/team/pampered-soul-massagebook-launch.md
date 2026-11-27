# The Pampered Soul — MassageBook replacement & commercial launch

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

| Milestone | Date |
| --- | --- |
| Target readiness | Friday, December 11, 2026 |
| Commercial launch | Saturday, December 12, 2026 |

## Planning status

This is a **proposed, conditional** schedule. The goal is to replace the MassageBook workflows The Pampered Soul actually uses — not every MassageBook feature in the abstract.

Scope for the December 11 cutover is decided on December 1 after the walkthrough and gap assessment. Keep MassageBook active until required workflows are accepted and the necessary data has been migrated and reconciled.

**Deadline prep (Nov 27–Dec 1):** walkthrough agenda, this-week owner actions, gap matrix, Dec 1 decision pack, and acceptance templates live in [pampered-soul-deadline-prep.md](pampered-soul-deadline-prep.md).

Related desk contract: [../architecture/pampered-soul.md](../architecture/pampered-soul.md).

## Timeline

| Window | Focus | Outcome |
| --- | --- | --- |
| **Nov 30** | MassageBook walkthrough and requirements | Team meeting decides which required features to implement: client information, payments, reports, data to transfer, and acceptance criteria. |
| **Dec 1** | Gap assessment and feasibility decision | Compare documented requirements with the current application. Estimate remaining work, assign owners, identify dependencies, and decide the scope of the December 11 replacement. |
| **Dec 1–4** | Parallel development and migration rehearsal | Build the confirmed scheduling, client management, payment, and financial requirements. In parallel, establish production authentication, permissions, database, and deployment. Compare new system functionality with existing MassageBook functionality. |
| **Dec 7–8** | Integration, QA, and sponsor testing | Test end-to-end staff and customer workflows, payment and reporting, access controls, and migrated data. Fix and retest defects. |
| **Dec 9** | Go / no-go review | Review feature completeness, payment readiness, data reconciliation, security, backups, and open defects. Freeze the release and proceed only if launch criteria are satisfied. |
| **Dec 10** | Deployment rehearsal and staff training | Contact Tabatha (The Pampered Soul) about deployment, data migration, restore, and rollback. Verify monitoring and production configuration. |
| **Dec 11** | Cutover and sign-off | If approved: final export, migrate and reconcile required records, verify production workflows, obtain sponsor sign-off. Keep a defined rollback point. |
| **Dec 12** | Commercial launch and support | Monitor bookings, payments, and errors; provide named support. Discuss Rise Local’s future licensing and integration requirements separately. |

## MassageBook walkthrough checklist (Nov 30)

Document only what staff actually use day to day:

- Booking, rescheduling, cancellation, checkout, and any other appointment workflows in use.
- Staff calendars, availability, services, pricing, and business rules.
- Client information, preferences, appointment history, and records to migrate.
- Payment methods, deposits, refunds, reconciliation, and the requested payment portal.
- Customer confirmations, reminders, communications, reports, and exports.
- Any other integrations or day-to-day functions staff rely on.

Capture acceptance criteria for each confirmed workflow before Dec 1 scoping.

## Dependencies and launch requirements

- Confirm MassageBook export access, migration scope, record counts, reconciliation ownership, and a final cutover window.
- Confirm payment provider and merchant approvals; complete production payment and compliance review.
- Establish real user authentication, server-enforced permissions, a production database, monitoring, and tested backup and restore.
- Assign development, QA, deployment, and support owners.
- Obtain sponsor sign-off after all required replacement workflows pass and critical defects are resolved.

## Contingency

Keep MassageBook active until required workflows are accepted and the necessary data has been migrated and reconciled.

If the **December 1** assessment or **December 9** review shows the deadline is not safe or feasible, notify the sponsor immediately and agree on either:

1. A revised cutover date, or
2. A clearly defined limited launch that runs alongside MassageBook.

Do not take a full cutover without sponsor sign-off.

## Current Stemworks baseline (for Dec 1 gap assessment)

Snapshot of what the Pampered Soul desk already covers in-repo. Use this as the starting point when comparing against the Nov 30 MassageBook notes — not as a claim that replacement is complete.

| Area | In Stemworks today | Likely gap vs MassageBook |
| --- | --- | --- |
| Spa services & pricing | Hardcoded live menu in `apps/web/lib/experiences/spa-menu.ts` | Staff-editable services, specials, and business rules |
| Client booking | Public `/book` creates `ServiceAppointment` rows | Reschedule / cancel / checkout flows staff use in MassageBook |
| Owner schedule | `/thepamperedsoul/bookings`, `/thepamperedsoul/calendar` | Staff calendars, availability windows, multi-provider scheduling |
| Clients / CRM | Guest profiles + consented CRM at `/thepamperedsoul/crm` | Full client history, preferences, and migration import |
| Payments | Stripe/demo for **ticketed events**; spa appointments store `priceCents` without card capture | Spa deposits, refunds, reconciliation, payment portal |
| Reports | `/thepamperedsoul/scorecard` (ticket revenue / consent) | Financial and appointment reports staff expect from MassageBook |
| Auth & tenancy | Demo venture/role login; architecture for JWT/RLS in [../architecture/security.md](../architecture/security.md) | Production auth, server-enforced permissions, production DB |
| Data migration | No MassageBook export/import path yet | Export access, mapping, reconciliation, cutover rehearsal |
| Ticketed events | Owner planner + guest `/e/{slug}` checkout | Keep as-is unless walkthrough says otherwise; not a MassageBook substitute |

Update this table after the Dec 1 decision with owners and in/out-of-scope rows for the December 11 freeze. Detailed risk ratings and Dec 1 scope columns: [pampered-soul-deadline-prep.md](pampered-soul-deadline-prep.md).

## Decision log

| Date | Decision | Notes |
| --- | --- | --- |
| 2026-11-27 | Prep pack opened; full spa cutover not assumed until Dec 1 | See [pampered-soul-deadline-prep.md](pampered-soul-deadline-prep.md) |
| | | Fill after Nov 30 walkthrough and Dec 1 feasibility meeting. |
