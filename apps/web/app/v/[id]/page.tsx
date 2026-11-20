/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDemoSession } from "@/lib/auth/session";
import { FEATURE_CATALOG, METRIC_CATALOG } from "@/lib/ventures/blueprint";
import { getBlueprint } from "@/lib/ventures/blueprint-store";
import { deskHrefForBlueprint, linkedVentureForBlueprint } from "@/lib/ventures/live-features";

export const dynamic = "force-dynamic";

export default async function CustomVentureDeskPage({ params }: { params: { id: string } }) {
  const session = getDemoSession();
  if (!session.signedIn) redirect("/login");
  if (!session.appOwner && session.role !== "owner") redirect(session.definition.homeHref);

  const blueprint = await getBlueprint(params.id);
  if (!blueprint) notFound();

  const linked = linkedVentureForBlueprint(blueprint);
  if (linked) {
    redirect(deskHrefForBlueprint(blueprint));
  }

  const enabled = FEATURE_CATALOG.filter((item) => blueprint.features.includes(item.key));
  const metrics = METRIC_CATALOG.filter((item) => blueprint.metricOrder.includes(item.key)).sort(
    (a, b) => blueprint.metricOrder.indexOf(a.key) - blueprint.metricOrder.indexOf(b.key),
  );

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Custom venture desk</p>
        <h1 className="mt-1 font-display text-4xl text-stone-950">{blueprint.name}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {blueprint.statusLabel}. This desk is driven by the organizer — enabled features and metric order below.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/organize" className="underline underline-offset-4">
            Edit in organizer
          </Link>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Board metrics (live order)</h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {metrics.map((item, index) => (
            <li key={item.key} className="rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">#{index + 1}</p>
              <p className="mt-1 font-medium text-stone-950">{item.label}</p>
              <p className="mt-1 text-xs text-stone-500">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Enabled features</h2>
        {enabled.length === 0 ? (
          <p className="text-sm text-stone-600">No features enabled. Turn some on in the organizer.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {enabled.map((item) => (
              <li key={item.key} className="rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-3">
                <p className="font-medium text-stone-950">{item.label}</p>
                <p className="mt-1 text-xs text-stone-500">{item.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
