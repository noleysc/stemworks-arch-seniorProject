/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { listTenants } from "@/lib/dashboard/registry";

const desks = [
  {
    key: "luminary",
    href: "/luminary",
    title: "Luminary",
    body: "Hotel rentals and dining collection for Luminary Hotel & Co.",
  },
  {
    key: "jade",
    href: "/jade",
    title: "Jade",
    body: "Jade Flowers product ops — materials, batches, and orders.",
  },
  {
    key: "thepamperedsoul",
    href: "/thepamperedsoul",
    title: "The Pampered Soul",
    body: "Spa business desk — services, schedule, CRM, and ticketed events.",
  },
] as const;

export default function DeskHubPage() {
  const tenants = listTenants();

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Stemworks</p>
        <h1 className="mt-1 font-display text-4xl text-stone-950">Choose a desk</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Three venture desks, kept separate. Tenants never sum into each other on the founder board.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {desks.map((desk) => (
          <Link
            key={desk.key}
            href={desk.href}
            className="rounded-3xl border border-stone-900/10 bg-white/90 p-6 transition hover:border-stone-900/30"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">{desk.href}</p>
            <p className="mt-2 font-display text-3xl text-stone-950">{desk.title}</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">{desk.body}</p>
          </Link>
        ))}
      </div>

      <p className="text-sm text-stone-600">
        Founder board:{" "}
        {tenants.map((tenant, index) => (
          <span key={tenant.key}>
            {index > 0 ? " · " : null}
            <Link href={`/dashboard?tenant=${tenant.key}`} className="underline underline-offset-4">
              {tenant.name}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
