/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { formatDate } from "@/lib/dates";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { formatMoney } from "@/lib/money";
import { listExperienceEvents } from "@/lib/experiences/events";
import { eventScorecard } from "@/lib/experiences/scorecard";
import { ensurePamperedEvents } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export default async function ExperiencesHomePage() {
  const venture = await ensurePamperedEvents();
  const events = await listExperienceEvents();
  const scorecard = events[0] ? await eventScorecard(events[0].slug) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm text-slate-600">
            Owner desk · {venture.statusLabel} · prefix {venture.prefixCode}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Plan events</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            This desk is for The Pampered Soul owner. Guests never see it — they only get the public invite
            at <code className="rounded bg-slate-200/70 px-1">/e/&#123;slug&#125;</code>. Add spa treatments
            from the menu, publish, then share the guest link.
          </p>
        </div>
        <Link
          href="/experiences/new"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-[#eef2f6]"
        >
          Plan an event
        </Link>
      </div>

      {events.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-900/15 bg-white/70 p-8">
          <h2 className="font-display text-2xl">No events yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">
            Create an invite, pick treatments from The Pampered Soul menu, and publish a public link
            guests can buy tickets on.
          </p>
        </section>
      ) : null}

      {events.map((event) => (
        <section
          key={event.id}
          className="overflow-hidden rounded-3xl border border-slate-900/10 bg-white/90"
        >
          <div className="p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{event.statusLabel}</p>
            <h2 className="mt-3 font-display text-3xl text-slate-950">{event.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{event.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {event.startsAtLabel ?? formatDate(event.startsOn)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{event.location}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {event.ticketCount}/{event.capacity} tickets
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {event.itinerary.filter((item) => item.serviceKey).length} treatments
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/experiences/${event.slug}`}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-[#eef2f6]"
              >
                Edit in planner
              </Link>
              {(event.status === "open" || event.status === "full") && (
                <Link
                  href={`/e/${event.slug}`}
                  className="rounded-full border border-slate-900/15 px-4 py-2 text-sm text-slate-900"
                  target="_blank"
                >
                  Guest invite
                </Link>
              )}
              <Link
                href="/experiences/guests"
                className="rounded-full border border-slate-900/15 px-4 py-2 text-sm text-slate-900"
              >
                Guest list
              </Link>
            </div>
          </div>
        </section>
      ))}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Tickets sold" value={String(scorecard?.ticketsSold ?? 0)} detail="paid seats" />
        <Stat
          label="Revenue"
          value={formatMoney(scorecard?.ticketRevenueCents ?? 0)}
          detail="confirmed ticket sales"
        />
        <Stat label="Checked in" value={String(scorecard?.attendance ?? 0)} detail="attendance" />
        <Stat
          label="Marketing opt-ins"
          value={String(scorecard?.optInsByVendor.reduce((sum, row) => sum + row.optIns, 0) ?? 0)}
          detail="consent grants"
        />
      </div>

      {events[0] ? (
        <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <h2 className="font-display text-2xl">Spa treatments on the latest event</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {events[0].itinerary
              .filter((item) => item.serviceKey)
              .map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-4">
                  <p className="font-medium">
                    {item.emoji ? `${item.emoji} ` : ""}
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.startsAtLabel}
                    {item.menuPriceCents != null ? ` · ${formatTicketPrice(item.menuPriceCents)}` : ""}
                  </p>
                </li>
              ))}
            {events[0].itinerary.every((item) => !item.serviceKey) ? (
              <li className="text-sm text-slate-600">No spa menu items on this event yet.</li>
            ) : null}
          </ul>
        </section>
      ) : null}
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
