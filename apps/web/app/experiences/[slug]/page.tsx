/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { notFound } from "next/navigation";

import { EventEditor } from "@/components/experiences/event-editor";
import { formatDate } from "@/lib/dates";
import { getEventBySlug } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export default async function ExperienceEditorPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">
          <Link href="/experiences" className="underline">
            Events
          </Link>{" "}
          · owner desk · {event.statusLabel}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">{event.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {event.startsAtLabel ?? formatDate(event.startsOn)} · {event.location}
        </p>
      </div>
      <EventEditor event={event} />
    </div>
  );
}
