/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { formatDate } from "@/lib/dates";
import { listAppointments } from "@/lib/experiences/appointments";
import { listExperienceEvents } from "@/lib/experiences/events";

export async function EmployeeHome() {
  const [events, appointments] = await Promise.all([listExperienceEvents(), listAppointments()]);
  const openEvents = events.filter((event) => event.status === "open" || event.status === "full");
  const todayBookings = appointments.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Employee desk</p>
        <h1 className="mt-1 font-display text-4xl text-stone-950">Today’s floor</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Operational tools only — check-in, schedule, and bookings. Confirmed and Potential stay on the owner board.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <OpsCard href="/experiences/guests" title="Check-in" body="Ticketed guests for tonight’s invites." meta={`${openEvents.length} open invites`} />
        <OpsCard href="/experiences/calendar" title="Schedule" body="Invites and spa appointments on one calendar." />
        <OpsCard href="/experiences/bookings" title="Bookings" body="Individual spa services on the books." meta={`${appointments.length} on file`} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <h2 className="font-display text-2xl">Open invites</h2>
          {openEvents.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">No published invites need floor coverage.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {openEvents.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2">
                  <div>
                    <p className="font-medium text-stone-950">{event.title}</p>
                    <p className="text-stone-600">
                      {event.startsAtLabel ?? formatDate(event.startsOn)} · {event.ticketCount}/{event.capacity} tickets
                    </p>
                  </div>
                  <Link href="/experiences/guests" className="shrink-0 underline underline-offset-4">
                    Check-in
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <h2 className="font-display text-2xl">Upcoming services</h2>
          {todayBookings.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">No spa appointments on file yet.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {todayBookings.map((row) => (
                <li key={row.id} className="border-b border-stone-100 pb-2">
                  <p className="font-medium text-stone-950">{row.serviceTitle}</p>
                  <p className="text-stone-600">
                    {row.clientName} · {row.appointmentOn} {row.startsAtLabel}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function OpsCard({
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
    <Link href={href} className="rounded-2xl border border-stone-900/10 bg-white/90 p-5 transition hover:border-stone-900/30">
      <p className="font-display text-2xl text-stone-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
      {meta ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">{meta}</p> : null}
    </Link>
  );
}
