/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { notFound } from "next/navigation";

import { GuestInviteView } from "@/components/experiences/guest-invite-view";
import { getEventBySlug, listGuestWall } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

/** Owner-only preview of the guest invite, including drafts. Checkout stays locked. */
export default async function InvitePreviewPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const wall = await listGuestWall(event.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3">
        <p className="text-sm text-slate-700">
          Previewing guest invite ·{" "}
          <Link href={`/experiences/${event.slug}`} className="underline">
            Back to editor
          </Link>
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
          {event.statusLabel}
        </span>
      </div>
      <GuestInviteView event={event} wall={wall} preview />
    </div>
  );
}
