/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { formatDate } from "@/lib/dates";
import { listAppointments } from "@/lib/experiences/appointments";
import { listExperienceEvents } from "@/lib/experiences/events";
import { formatMoney } from "@/lib/money";
import { eventScorecard } from "@/lib/experiences/scorecard";
import { ensurePamperedSoul } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

/** Pampered Soul business hub — events are one area of the spa desk. */
export default async function PamperedSoulHomePage() {
  const venture = await ensurePamperedSoul();
  const [events, appointments, scorecard] = await Promise.all([
    listExperienceEvents(),
    listAppointments(),
    eventScorecard(),
  ]);

  const openInvites = events.filter((event) => event.status === "open" || event.status === "full");
  const upcomingBookings = appointments.slice(0, 5);
  const nextEvent = openInvites[0] ?? events[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">
          {venture.statusLabel} · prefix {venture.prefixCode}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">{venture.name}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Business desk for the spa: services, schedule, guests, and CRM. Ticketed events are one line of business
          inside this desk—not the whole product.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HubCard
          href="/experiences/events"
          title="Events"
          body="Ticketed invites, publish, and guest checkout links."
          meta={`${openInvites.length} open`}
        />
        <HubCard
          href="/experiences/bookings"
          title="Spa bookings"
          body="Individual services clients book for themselves."
          meta={`${appointments.length} on file`}
        />
        <HubCard
          href="/experiences/calendar"
          title="Schedule"
          body="Invites, appointments, and booked guests on one calendar."
        />
        <HubCard
          href="/experiences/crm"
          title="CRM & guests"
          body="Check-in, consented contacts, and scorecard."
          meta="Guests · CRM · Scorecard"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tickets sold" value={String(scorecard?.ticketsSold ?? 0)} detail="across invites" />
        <Stat
          label="Ticket revenue"
          value={formatMoney(scorecard?.ticketRevenueCents ?? 0)}
          detail="confirmed sales"
        />
        <Stat
          label="Spa appointments"
          value={String(appointments.length)}
          detail="individual service bookings"
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-900/10 bg-white/90 p-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl">Next invite</h2>
            <Link href="/experiences/events" className="text-sm underline underline-offset-4">
              All events
            </Link>
          </div>
          {nextEvent ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="text-lg font-medium text-slate-950">{nextEvent.title}</p>
              <p>
                {nextEvent.startsAtLabel ?? formatDate(nextEvent.startsOn)} · {nextEvent.ticketCount}/
                {nextEvent.capacity} tickets · {nextEvent.statusLabel}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  href={`/experiences/${nextEvent.slug}`}
                  className="rounded-full bg-slate-950 px-3 py-1.5 text-sm text-[#eef2f6]"
                >
                  Open invite
                </Link>
                <Link
                  href="/experiences/new"
                  className="rounded-full border border-slate-900/15 px-3 py-1.5 text-sm"
                >
                  Create invite
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No invites yet.{" "}
              <Link href="/experiences/new" className="underline underline-offset-4">
                Create a ticketed invite
              </Link>{" "}
              when you need an event night.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-900/10 bg-white/90 p-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl">Upcoming services</h2>
            <Link href="/experiences/bookings" className="text-sm underline underline-offset-4">
              All bookings
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              No spa appointments yet. Clients book at{" "}
              <Link href="/book" className="underline underline-offset-4">
                /book
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {upcomingBookings.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>
                    <span className="font-medium text-slate-950">{row.serviceTitle}</span>
                    <span className="text-slate-600">
                      {" "}
                      · {row.clientName} · {row.appointmentOn} {row.startsAtLabel}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-sm text-slate-600">
        Founder board for this tenant:{" "}
        <Link href="/dashboard?tenant=pampered_soul" className="underline underline-offset-4">
          Dashboard
        </Link>
        .
      </p>
    </div>
  );
}

function HubCard({
  href,
  title,
  body,
  meta,
}: {
  href: string;
  title: string;
  body: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-900/10 bg-white/90 p-5 transition hover:border-slate-900/30"
    >
      <p className="font-display text-2xl text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      {meta ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{meta}</p> : null}
    </Link>
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
