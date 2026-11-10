/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { formatDate } from "@/lib/dates";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { formatMoney } from "@/lib/money";
import { listExperienceEvents } from "@/lib/experiences/events";
import { eventScorecard } from "@/lib/experiences/scorecard";
import { ensureJadeExperiences } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export default async function ExperiencesHomePage() {
  const venture = await ensureJadeExperiences();
  const [events, scorecard] = await Promise.all([listExperienceEvents(), eventScorecard()]);
  const event = events[0];

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">
          {venture.statusLabel} · prefix {venture.prefixCode}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">{venture.name}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Partiful-style invites with real ticket sales, plus per-vendor marketing consent into private
          CRMs. Buying a ticket is not marketing consent — checking a host box is.
        </p>
      </div>

      {event ? (
        <section className="overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950 text-[#eef2f6]">
          <div className="bg-[linear-gradient(135deg,rgba(251,191,36,0.22),transparent_50%),linear-gradient(160deg,#0f172a,#020617)] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">December 18 pilot</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">{event.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{event.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1">
                {event.startsAtLabel ?? formatDate(event.startsOn)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">{event.location}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {event.ticketCount}/{event.capacity} tickets
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {formatMoney(scorecard.ticketRevenueCents)} sold
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/e/${event.slug}`}
                className="rounded-full bg-[#eef2f6] px-4 py-2 text-sm font-medium text-slate-950"
              >
                Public invite
              </Link>
              <Link
                href="/experiences/guests"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-[#eef2f6]"
              >
                Guest list & check-in
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Tickets sold" value={String(scorecard.ticketsSold)} detail="paid seats" />
        <Stat label="Revenue" value={formatMoney(scorecard.ticketRevenueCents)} detail="confirmed ticket sales" />
        <Stat label="Checked in" value={String(scorecard.attendance)} detail="attendance" />
        <Stat
          label="Marketing opt-ins"
          value={String(scorecard.optInsByVendor.reduce((sum, row) => sum + row.optIns, 0))}
          detail="consent grants"
        />
      </div>

      <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-5">
        <h2 className="font-display text-2xl">Ticket tiers</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {(event?.tiers ?? []).map((tier) => (
            <li key={tier.id} className="rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-4">
              <p className="font-medium">{tier.label}</p>
              <p className="text-sm text-slate-600">{formatTicketPrice(tier.priceCents)}</p>
              <p className="mt-3 text-sm">
                {tier.quantitySold} sold · {tier.remaining} left
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-5">
        <h2 className="font-display text-2xl">Participating businesses</h2>
        <p className="mt-1 text-sm text-slate-600">
          Opt-in on the invite grants marketing consent for that business only.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {(event?.vendors ?? []).map((vendor) => {
            const optIns =
              scorecard.optInsByVendor.find((row) => row.businessKey === vendor.businessKey)?.optIns ?? 0;
            return (
              <li key={vendor.id} className="rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-4">
                <p className="font-medium">{vendor.displayName}</p>
                <p className="text-sm text-slate-600">{vendor.roleLabel}</p>
                <p className="mt-3 text-sm">{optIns} marketing consents</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
      <p className="text-sm text-slate-600">{detail}</p>
    </div>
  );
}
