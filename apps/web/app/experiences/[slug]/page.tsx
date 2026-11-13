/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { notFound } from "next/navigation";

import { EventEditor } from "@/components/experiences/event-editor";
import { ShareInviteLink } from "@/components/experiences/share-invite-link";
import { formatDate } from "@/lib/dates";
import { getEventBySlug } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export default async function ExperienceEditorPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const published = event.status === "open" || event.status === "full";

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">
          <Link href="/experiences" className="underline">
            Invites
          </Link>{" "}
          · ticketed invite creator · {event.statusLabel}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">{event.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {event.startsAtLabel ?? formatDate(event.startsOn)} · {event.location} · {event.tiers.length} ticket{" "}
          {event.tiers.length === 1 ? "type" : "types"} · {event.ticketCount} sold
        </p>
      </div>
      <ShareInviteLink slug={event.slug} published={published} />
      <EventEditor
        key={`${event.slug}-${event.status}-${event.title}-${event.tiers.map((t) => `${t.id}:${t.quantityAvailable}:${t.priceCents}`).join("|")}`}
        event={event}
      />
    </div>
  );
}
