/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { formatMoney } from "@/lib/money";
import { eventScorecard } from "@/lib/experiences/scorecard";

export const dynamic = "force-dynamic";

export default async function ScorecardPage() {
  const scorecard = await eventScorecard();
  if (!scorecard) {
    return (
      <p className="text-sm text-slate-600">
        No event to score yet.{" "}
        <a className="underline" href="/thepamperedsoul/new">
          Plan one
        </a>
        .
      </p>
    );
  }
  const checkInPct =
    scorecard.checkInRate === null ? "—" : `${Math.round(scorecard.checkInRate * 100)}%`;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-slate-950">Event scorecard</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Tickets sold" value={String(scorecard.ticketsSold)} />
        <Metric
          label="Ticket revenue"
          value={formatMoney(scorecard.ticketRevenueCents)}
        />
        <Metric label="Attendance" value={String(scorecard.attendance)} />
        <Metric label="Check-in completion" value={checkInPct} />
        <Metric
          label="Follow-ups queued"
          value={String(scorecard.followUpQueued)}
        />
        <Metric label="Consent audits" value={String(scorecard.consentAudits)} />
      </div>

      <section className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
        <h2 className="font-display text-2xl">Tier mix</h2>
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
        <h2 className="font-display text-2xl">Marketing consents by vendor</h2>
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
