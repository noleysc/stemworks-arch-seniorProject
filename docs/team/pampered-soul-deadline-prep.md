# Pampered Soul — deadline prep pack

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Working pack for the conditional MassageBook cutover. Parent schedule: [pampered-soul-massagebook-launch.md](pampered-soul-massagebook-launch.md).

| Today | Next hard gate | Target readiness | Commercial launch |
| --- | --- | --- | --- |
| Fri Nov 27, 2026 | Mon Nov 30 walkthrough | Fri Dec 11, 2026 | Sat Dec 12, 2026 |

**Working posture until Dec 1 decides otherwise:** keep MassageBook as system of record. Treat Stemworks spa features as additive. Full cutover on Dec 11 is not assumed feasible until high-risk gaps below are either closed or explicitly deferred into a limited launch.

---

## This week (Nov 27–30) — do before the walkthrough

| Owner | Action | Done when |
| --- | --- | --- |
| **Nolan** | Schedule Nov 30 walkthrough with Tabatha / Pampered Soul staff; send this pack + checklist | Meeting invite + agenda confirmed |
| **Nolan** | Confirm who can export MassageBook data and whether a sample export is available before Dec 1 | Contact + sample or written blocker |
| **Henry** | Confirm Stripe / merchant path for **spa** (not only ticketed events): account, keys, deposits, refunds | Written note in Decision log: ready / blocked / need sponsor |
| **Henry** | Sketch MassageBook → `GuestProfile` + `ServiceAppointment` field map from any sample CSV/export | Draft mapping table in this file’s Migration section |
| **Ryan** | Screenshot / note current `/book`, bookings list, and calendar so the walkthrough can contrast MassageBook vs Stemworks | Short demo path ready (5 minutes) |
| **Esmir** | List which scorecard / dashboard figures staff would need for spa (vs event-only scorecard today) | 5–10 report questions for Nov 30 |
| **All** | Read gap matrix below; mark any row you already know staff do **not** use | Notes ready for walkthrough |

Do **not** start a full spa payment or auth rewrite before Nov 30 confirms what MassageBook workflows are in scope.

---

## Nov 30 — walkthrough agenda (90 minutes)

Facilitator: Nolan. Scribe: assign at start. Sponsor / staff: Tabatha (+ any front-desk user).

1. **Open (5 min)** — Goal is replace workflows they actually use. MassageBook stays until accepted. Dec 11 is conditional.
2. **Live MassageBook pass (40 min)** — Staff drive; team only asks clarifying questions. Cover every checklist row; record “in use / unused / nice-to-have”.
3. **Stemworks contrast (15 min)** — Ryan shows `/book`, `/thepamperedsoul/bookings`, calendar, CRM, scorecard. Note “already covered / partial / missing”.
4. **Data & payments (15 min)** — Export access, record counts, reconciliation owner, payment methods in use, deposits/refunds, payment portal ask.
5. **Acceptance criteria draft (10 min)** — For each “in use” workflow, one sentence: “Done when staff can ___ without MassageBook.”
6. **Close (5 min)** — Confirm Dec 1 meeting time; list open blockers (export, merchant, Tabatha Dec 10 contact).

### Walkthrough capture sheet

Copy one row per MassageBook screen or workflow staff demonstrate:

| Workflow | In use? | Must replace by Dec 11? | Acceptance (“Done when…”) | Stemworks today | Owner after Dec 1 |
| --- | --- | --- | --- | --- | --- |
| New appointment | | | | Public `/book` create only | |
| Reschedule | | | | Missing | |
| Cancel | | | | Missing (spa) | |
| Checkout / mark paid | | | | Missing (spa) | |
| Staff availability | | | | Fixed time list; no providers | |
| Client profile / prefs | | | | Guest name/email/phone + notes | |
| Deposits / refunds | | | | Ticket Stripe only | |
| Reminders / confirmations | | | | On-screen code only | |
| Reports / exports | | | | Event scorecard | |
| Other: ___ | | | | | |

---

## Gap matrix (code baseline as of Nov 27, 2026)

Use this on Dec 1. Update the **Dec 1 scope** column in the meeting (In / Out / Later / Dual-run).

| # | Area | Stemworks today | Gap | Cutover risk | Dec 1 scope |
| --- | --- | --- | --- | --- | --- |
| 1 | Appointment lifecycle | `POST/GET /api/experiences/appointments`; public `/book`; owner list read-only | No spa reschedule, cancel, complete, no-show, checkout; no conflict checks | **High** | |
| 2 | Staff schedule & availability | Month calendar mixes events + appointments; hardcoded menu + 9–6 time chips | No provider calendars, working hours, rooms, buffers, multi-therapist | **High** | |
| 3 | Services & pricing | `lib/experiences/spa-menu.ts` | Not staff-editable; day rules (e.g. Throwback Thursday) not enforced | **Med** | |
| 4 | Client records | `GuestProfile` + appointment notes; event CRM separate | No spa client file, preferences, history UI, merge, or import | **High** | |
| 5 | Spa payments | `priceCents` on appointment; Stripe only on ticket RSVP | No deposits, refunds, reconciliation, or spa payment portal | **High** | |
| 6 | Comms | Confirmation codes on screen | No email/SMS confirmations or reminders | **High** | |
| 7 | Reports / exports | Event scorecard; hub appointment counts | No spa financial/appointment reports or CSV export | **High** | |
| 8 | Prod auth / DB / backup | Demo session cookies; SQLite locally; Supabase wired but not spa cutover | No real auth on experiences APIs; no Postgres+RLS live; no tested restore | **High** | |
| 9 | MassageBook migration | None | No export→import path, mapping, rehearsal, or rollback | **High** | |
| 10 | Ticketed events | Planner + `/e/{slug}` + Stripe/demo | Keep unless walkthrough says otherwise | **Low** | Keep |

**Dec 1 recommended default if many High rows stay “must replace”:** limited launch (events + optional `/book` alongside MassageBook) and a revised spa cutover date — per contingency in the parent launch doc.

---

## Dec 1 — feasibility decision pack

Meeting outcome must be one of:

1. **Full cutover Dec 11** — every Must-replace row has an owner, acceptance criteria, and a believable Dec 1–4 build plan.
2. **Limited launch Dec 12** — list exactly what goes live in Stemworks and what stays on MassageBook.
3. **Slip cutover** — new target date + what continues in parallel until then.

### Decision checklist (fill in meeting)

| Question | Answer |
| --- | --- |
| Launch posture (1 / 2 / 3 above) | |
| Must-replace workflows (IDs from capture sheet) | |
| Explicitly out of Dec 11 scope | |
| MassageBook export access confirmed? | |
| Approximate record counts (clients / future appts / history) | |
| Reconciliation owner | |
| Final cutover window (timezone America/New_York) | |
| Payment provider + spa merchant status | |
| Prod auth / Postgres / backup owner | |
| Named support for Dec 12 | |
| Sponsor notified if not full cutover? | |

### Workstream owners (assign Dec 1)

| Workstream | Primary | Backup | Dec 1–4 deliverable |
| --- | --- | --- | --- |
| Spa appointment mutations (cancel / reschedule / status) | Henry (API) | Ryan (UI) | |
| Staff booking desk + availability (if in scope) | Ryan | Henry | |
| Spa payments / portal (if in scope) | Henry | Nolan (compliance gate) | |
| Client import + reconciliation | Henry | Nolan | |
| Reports / scorecard spa figures | Esmir | Ryan | |
| Production auth, permissions, DB, backup | Henry | Nolan | |
| QA script + sponsor test plan | Nolan | Ryan | |
| Dec 10 Tabatha rehearsal contact | Nolan | — | |
| Dec 12 named support | | | |

Peer review still follows Part 5: Ryan ↔ Henry; Nolan gates acceptance.

---

## Acceptance criteria template

One block per Must-replace workflow (paste into Decision log after Dec 1):

```text
Workflow:
Actor (staff / client):
Happy path:
Failure / edge cases:
Data needed from MassageBook:
Out of scope:
Automated test or manual script:
Sign-off owner:
```

### Go / no-go inputs (for Dec 9)

Carry forward; do not invent green status early:

- [ ] Every Must-replace acceptance criterion passed
- [ ] Spa payment ready (or explicitly out of scope with MassageBook retained for money)
- [ ] Migrated counts reconciled (or migration out of scope)
- [ ] Auth + permissions enforced on write APIs
- [ ] Backup restore rehearsed
- [ ] Critical defects closed
- [ ] Rollback point named
- [ ] Sponsor sign-off scheduled for Dec 11

---

## Migration sketch (fill after sample export)

| MassageBook field / export column | Stemworks target | Notes |
| --- | --- | --- |
| Client name | `GuestProfile.fullName` / `ServiceAppointment.clientName` | |
| Email | `GuestProfile.email` (unique) | |
| Phone | `GuestProfile.phone` | |
| Service | `serviceKey` / `serviceTitle` | Map to `spa-menu` keys or free text |
| Date | `appointmentOn` (`YYYY-MM-DD`) | America/New_York business date |
| Time | `startsAtLabel` | |
| Price | `priceCents` | Integer cents only |
| Status | `status` | Define enum with staff |
| Notes / prefs | `notes` (temp) or future columns | |
| History vs future | | Decide Dec 1: future-only vs N months history |

Rehearsal: dry-run import on a copy DB before Dec 7; final export only on Dec 11 if go.

---

## Decision log

| Date | Decision | Notes |
| --- | --- | --- |
| 2026-11-27 | Prep pack published; full Dec 11 spa cutover not assumed | High-risk gaps: appointment lifecycle, spa payments, migration, prod auth, reminders/reports |
| | | Fill after Nov 30 and Dec 1 |
