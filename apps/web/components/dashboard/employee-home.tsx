/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { getDemoSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { listAppointments } from "@/lib/experiences/appointments";
import { listExperienceEvents } from "@/lib/experiences/events";

export async function EmployeeHome() {
  const session = getDemoSession();
  const venture = session.activeVenture;

  if (venture === "luminary") return <LuminaryEmployee persona={session.definition.persona} />;
  if (venture === "diaz_ventures") return <JadeEmployee persona={session.definition.persona} />;
  return <PamperedEmployee persona={session.definition.persona} />;
}

async function PamperedEmployee({ persona }: { persona: string }) {
  const [events, appointments] = await Promise.all([listExperienceEvents(), listAppointments()]);
  const openEvents = events.filter((event) => event.status === "open" || event.status === "full");
  const todayBookings = appointments.slice(0, 6);

  return (
    <div className="space-y-6">
      <Header
        venture="The Pampered Soul"
        persona={persona}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <OpsCard href="/thepamperedsoul/guests" title="Check-in" meta={`${openEvents.length} open events`} />
        <OpsCard href="/thepamperedsoul/calendar" title="Schedule" />
        <OpsCard href="/thepamperedsoul/bookings" title="Bookings" meta={`${appointments.length} on file`} />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <h2 className="font-display text-2xl">Open events</h2>
          {openEvents.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">No published events need floor coverage.</p>
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
                  <Link href="/thepamperedsoul/guests" className="shrink-0 underline underline-offset-4">
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

function LuminaryEmployee({ persona }: { persona: string }) {
  return (
    <div className="space-y-6">
      <Header
        venture="Luminary Hotel & Co."
        persona={persona}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <OpsCard href="/luminary" title="Today" />
        <OpsCard href="/luminary/rooms" title="Rentals" />
        <OpsCard href="/luminary/restaurant" title="Restaurant" />
      </div>
      <p className="text-sm text-stone-600">
        Collect files on{" "}
        <Link href="/luminary/import" className="underline underline-offset-4">
          /luminary/import
        </Link>
        .
      </p>
    </div>
  );
}

function JadeEmployee({ persona }: { persona: string }) {
  return (
    <div className="space-y-6">
      <Header
        venture="Jade Flowers"
        persona={persona}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <OpsCard href="/jade" title="Today" />
        <OpsCard href="/jade/materials" title="Materials" />
        <OpsCard href="/jade/batches" title="Batches" />
      </div>
      <p className="text-sm text-stone-600">
        Open orders live on{" "}
        <Link href="/jade/orders" className="underline underline-offset-4">
          /jade/orders
        </Link>
        .
      </p>
    </div>
  );
}

function Header({
  venture,
  persona,
}: {
  venture: string;
  persona: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
        Employee · {venture}
      </p>
      <h1 className="mt-1 font-display text-4xl text-stone-950">{persona}’s floor</h1>
    </div>
  );
}

function OpsCard({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-stone-900/10 bg-white/90 p-5 transition hover:border-stone-900/30">
      <p className="font-display text-2xl text-stone-950">{title}</p>
      {meta ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">{meta}</p> : null}
    </Link>
  );
}
