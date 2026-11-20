/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { getDemoSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { listAppointments } from "@/lib/experiences/appointments";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { listExperienceEvents } from "@/lib/experiences/events";

export async function CustomerHome() {
  const session = getDemoSession();
  const { persona, ventureName } = session.definition;

  if (session.activeVenture === "luminary") {
    return (
      <div className="space-y-6">
        <Header
          venture={ventureName}
          persona={persona}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/luminary" className="rounded-2xl border border-stone-900/10 bg-white/90 p-5 transition hover:border-stone-900/30">
            <p className="font-display text-2xl text-stone-950">Property info</p>
            <p className="mt-2 text-sm leading-6 text-stone-800">Hours, dining, and what’s open tonight.</p>
          </Link>
          <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
            <p className="font-display text-2xl text-stone-950">Stay confirmations</p>
            <p className="mt-2 text-sm leading-6 text-stone-800">
              Demo guest portal — reservation detail lands here when the hotel API is wired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (session.activeVenture === "diaz_ventures") {
    return (
      <div className="space-y-6">
        <Header
          venture={ventureName}
          persona={persona}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/jade/products" className="rounded-2xl border border-stone-900/10 bg-white/90 p-5 transition hover:border-stone-900/30">
            <p className="font-display text-2xl text-stone-950">Products</p>
          </Link>
          <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
            <p className="font-display text-2xl text-stone-950">Your orders</p>
            <p className="mt-2 text-sm leading-6 text-stone-800">
              Demo shopper portal — order history will attach to this Jade identity.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [events, appointments] = await Promise.all([listExperienceEvents(), listAppointments()]);
  const openInvites = events.filter((event) => event.status === "open" || event.status === "full");
  const recentAppointments = appointments.slice(0, 5);

  return (
    <div className="space-y-6">
      <Header
        venture={ventureName}
        persona={persona}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/book" className="rounded-2xl border border-stone-900/10 bg-white/90 p-5 transition hover:border-stone-900/30">
          <p className="font-display text-2xl text-stone-950">Book a spa service</p>
        </Link>
        <Link href="/book?loop=1" className="rounded-2xl border border-stone-900/10 bg-white/90 p-5 transition hover:border-stone-900/30">
          <p className="font-display text-2xl text-stone-950">Lobby display</p>
          <p className="mt-2 text-sm leading-6 text-stone-800">Kiosk loop that rotates services and resets after each booking.</p>
        </Link>
        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <p className="font-display text-2xl text-stone-950">Open ticket nights</p>
          <p className="mt-2 text-sm leading-6 text-stone-800">
            {openInvites.length === 0
              ? "No public invites are open right now."
              : `${openInvites.length} invite${openInvites.length === 1 ? "" : "s"} you can join.`}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
        <h2 className="font-display text-2xl">Buy tickets</h2>
        {openInvites.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Check back when The Pampered Soul publishes a night.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {openInvites.map((event) => {
              const from = event.tiers[0] ? formatTicketPrice(event.tiers[0].priceCents) : null;
              return (
                <li key={event.id} className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <p className="font-medium text-stone-950">{event.title}</p>
                    <p className="text-sm text-stone-600">
                      {event.startsAtLabel ?? formatDate(event.startsOn)} · {event.location}
                      {from ? ` · from ${from}` : ""}
                    </p>
                  </div>
                  <Link href={`/e/${event.slug}`} className="rounded-full bg-stone-950 px-3 py-1.5 text-sm text-white">
                    Get tickets
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
        <h2 className="font-display text-2xl">Recent spa bookings</h2>
        <p className="mt-1 text-sm text-stone-600">Demo desk shows the latest appointments on file.</p>
        {recentAppointments.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">
            No appointments yet.{" "}
            <Link href="/book" className="underline underline-offset-4">
              Book a service
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {recentAppointments.map((row) => (
              <li key={row.id} className="border-b border-stone-100 pb-2">
                <p className="font-medium text-stone-950">{row.serviceTitle}</p>
                <p className="text-stone-600">
                  {row.appointmentOn} {row.startsAtLabel}
                  {row.confirmationCode ? ` · ${row.confirmationCode}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
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
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Customer · {venture}</p>
      <h1 className="mt-1 font-display text-4xl text-stone-950">Hello, {persona}</h1>
    </div>
  );
}
