/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { getDemoSession } from "@/lib/auth/session";
import type { VentureKey } from "@/lib/auth/ventures";
import { formatDate } from "@/lib/dates";
import { listCrmContacts } from "@/lib/experiences/crm";
import { listExperienceEvents } from "@/lib/experiences/events";

const DEMO_VENDOR_KEY: Record<VentureKey, string> = {
  pampered_soul: "jade_haven",
  luminary: "coastal_av",
  diaz_ventures: "wax_wick",
};

export async function VendorHome() {
  const session = getDemoSession();
  const venture = session.activeVenture;
  const businessKey = DEMO_VENDOR_KEY[venture];
  const { persona, ventureName } = {
    persona: session.definition.persona,
    ventureName: session.definition.ventureName,
  };

  if (venture !== "pampered_soul") {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
            Vendor · {ventureName}
          </p>
          <h1 className="mt-1 font-display text-4xl text-stone-950">{persona}</h1>
        </div>
        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Demo partner key</p>
          <p className="mt-2 font-display text-3xl text-stone-950">{businessKey}</p>
          <p className="mt-2 text-sm text-stone-600">
            {venture === "luminary"
              ? "Outlet and AV partners attach to Luminary events when that feed is wired."
              : "Supply partners attach to Jade purchase orders when that feed is wired."}
          </p>
        </div>
      </div>
    );
  }

  const [events, contacts] = await Promise.all([
    listExperienceEvents(),
    listCrmContacts(businessKey),
  ]);

  const participating = events
    .map((event) => {
      const vendor = event.vendors.find((item) => item.businessKey === businessKey);
      return vendor ? { event, vendor } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Vendor · {ventureName}</p>
        <h1 className="mt-1 font-display text-4xl text-stone-950">{persona}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Participating-business view for Pampered Soul events. Operational presence for every guest; contact
          channels only when they opted into your marketing.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Events</p>
          <p className="mt-2 font-display text-4xl">{participating.length}</p>
        </div>
        <div className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Marketing consents</p>
          <p className="mt-2 font-display text-4xl">{contacts.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
        <h2 className="font-display text-2xl">Your events</h2>
        {participating.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">
            You are not on any event yet. When The Pampered Soul adds Jade Haven as a vendor, it shows here.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {participating.map(({ event, vendor }) => (
              <li key={event.id} className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <p className="font-medium text-stone-950">{event.title}</p>
                  <p className="text-sm text-stone-600">
                    {event.startsAtLabel ?? formatDate(event.startsOn)} · {vendor.roleLabel} · {event.statusLabel}
                  </p>
                </div>
                <Link
                  href={`/vendor/events/${event.slug}?business=${businessKey}`}
                  className="rounded-full bg-stone-950 px-3 py-1.5 text-sm text-white"
                >
                  Guest list
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-900/10 bg-white/90 p-5">
        <h2 className="font-display text-2xl">Opted-in contacts</h2>
        {contacts.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">No marketing consents for Jade Haven yet.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {contacts.map((contact) => (
              <li key={contact.id} className="border-b border-stone-100 pb-2">
                <p className="font-medium text-stone-950">{contact.fullName}</p>
                <p className="text-stone-600">
                  {[contact.email, contact.phone].filter(Boolean).join(" · ") || "Channels hidden"} ·{" "}
                  {contact.followUpLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
