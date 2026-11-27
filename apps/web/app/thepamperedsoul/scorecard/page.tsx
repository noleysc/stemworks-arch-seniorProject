/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { spaAppointmentReport } from "@/lib/experiences/appointments";
import { appointmentStatusLabel, paymentStatusLabel } from "@/lib/experiences/appointment-catalog";
import { eventScorecard } from "@/lib/experiences/scorecard";

export const dynamic = "force-dynamic";

export default async function ScorecardPage() {
  const [scorecard, spaReport] = await Promise.all([eventScorecard(), spaAppointmentReport()]);
  const checkInPct =
    scorecard?.checkInRate == null ? "—" : `${Math.round(scorecard.checkInRate * 100)}%`;

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-slate-950">Scorecard</h1>
        <p className="mt-2 text-sm text-slate-600">Spa appointment financials plus event ticket metrics.</p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl text-slate-950">Spa appointments</h2>
          <a
            href="/api/experiences/appointments/export?includeCancelled=1"
            className="text-sm underline underline-offset-4"
          >
            Export appointments CSV
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Appointments" value={String(spaReport.totalAppointments)} />
          <Metric label="Booked revenue" value={formatMoney(spaReport.bookedRevenueCents)} />
          <Metric label="Collected" value={formatMoney(spaReport.collectedCents)} />
          <Metric label="Outstanding" value={formatMoney(spaReport.outstandingCents)} />
          <Metric label="Completed" value={String(spaReport.completedCount)} />
          <Metric label="No-shows" value={String(spaReport.noShowCount)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
            <h3 className="font-display text-2xl">By status</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {Object.entries(spaReport.byStatus).map(([status, count]) => (
                <li key={status} className="flex justify-between gap-3">
                  <span>{appointmentStatusLabel(status)}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
            <h3 className="font-display text-2xl">By payment</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {Object.entries(spaReport.byPaymentStatus).map(([status, count]) => (
                <li key={status} className="flex justify-between gap-3">
                  <span>{paymentStatusLabel(status)}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-3xl text-slate-950">Events</h2>
        {!scorecard ? (
          <p className="text-sm text-slate-600">
            No event to score yet.{" "}
            <Link className="underline" href="/thepamperedsoul/new">
              Plan one
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Tickets sold" value={String(scorecard.ticketsSold)} />
              <Metric label="Ticket revenue" value={formatMoney(scorecard.ticketRevenueCents)} />
              <Metric label="Attendance" value={String(scorecard.attendance)} />
              <Metric label="Check-in completion" value={checkInPct} />
              <Metric label="Follow-ups queued" value={String(scorecard.followUpQueued)} />
              <Metric label="Consent audits" value={String(scorecard.consentAudits)} />
            </div>

            <section className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
              <h3 className="font-display text-2xl">Tier mix</h3>
              <ul className="mt-4 space-y-3">
                {scorecard.tiers.map((row) => (
                  <li key={row.key} className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="font-medium">{row.label}</span>
                      <span className="text-slate-500">
                        {" "}
                        · {row.sold} sold · {row.remaining} left
                      </span>
                    </span>
                    <span>{formatMoney(row.revenueCents)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
              <h3 className="font-display text-2xl">Marketing consents by vendor</h3>
              <ul className="mt-4 space-y-3">
                {scorecard.optInsByVendor.map((row) => (
                  <li key={row.businessKey} className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="font-medium">{row.displayName}</span>
                      <span className="text-slate-500"> · {row.businessKey}</span>
                    </span>
                    <span>{row.optIns}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/90 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}
