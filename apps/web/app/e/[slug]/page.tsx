/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { notFound } from "next/navigation";

import { RsvpForm } from "@/components/experiences/rsvp-form";
import { formatDate } from "@/lib/dates";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { getEventBySlug, listGuestWall } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export default async function PublicEventPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const wall = await listGuestWall(event.id);
  const fromPrice = Math.min(...event.tiers.map((tier) => tier.priceCents));

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.28),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.18),transparent_30%),linear-gradient(160deg,#111827_0%,#020617_55%,#000_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:pt-16">
          <section className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber-100/80">
                {event.hostDisplayName} invites you
              </p>
              <h1 className="max-w-xl font-display text-5xl leading-[0.95] text-white sm:text-7xl">
                {event.title}
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">{event.summary}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-100">
              <Meta>{event.startsAtLabel ?? formatDate(event.startsOn)}</Meta>
              <Meta>{event.location}</Meta>
              <Meta>
                {event.goingCount} going · from {formatTicketPrice(fromPrice)}
              </Meta>
            </div>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Who is going</p>
                  <h2 className="mt-1 font-display text-2xl">The wall</h2>
                </div>
                <p className="text-sm text-slate-400">{event.ticketCount} tickets claimed</p>
              </div>
              {wall.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Be first on the wall. Grab a ticket and optionally share your first name.
                </p>
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {wall.map((guest, index) => (
                    <li
                      key={`${guest.wallName}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <p className="font-medium text-white">{guest.wallName}</p>
                      <p className="text-sm text-slate-400">
                        {guest.guestNote || `${guest.ticketQuantity} ticket${guest.ticketQuantity > 1 ? "s" : ""}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">With</p>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {event.vendors.map((vendor) => (
                  <li key={vendor.id} className="rounded-full border border-white/15 px-3 py-1 text-slate-200">
                    {vendor.displayName}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <RsvpForm
            slug={event.slug}
            disclosureText={event.disclosureText}
            vendors={event.vendors.map((vendor) => ({
              businessKey: vendor.businessKey,
              displayName: vendor.displayName,
              roleLabel: vendor.roleLabel,
            }))}
            tiers={event.tiers.map((tier) => ({
              key: tier.key,
              label: tier.label,
              description: tier.description,
              priceCents: tier.priceCents,
              remaining: tier.remaining,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{children}</span>;
}
