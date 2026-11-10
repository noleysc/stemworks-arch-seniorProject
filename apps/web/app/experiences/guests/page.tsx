/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { CheckInBoard } from "@/components/experiences/check-in-board";
import { getPrimaryEvent, listRegistrations } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const event = await getPrimaryEvent();
  if (!event) {
    return (
      <p className="text-sm text-slate-600">
        No event yet.{" "}
        <Link className="underline" href="/experiences/new">
          Plan one
        </Link>{" "}
        and publish it first.
      </p>
    );
  }
  const registrations = await listRegistrations(event.id);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">Owner desk · {event.title}</p>
        <h1 className="mt-2 font-display text-4xl text-slate-950">Guest list & check-in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Tickets and check-in are operational. Marketing consent only comes from the invite checkboxes —
          never from buying a ticket or scanning in.
        </p>
        {(event.status === "open" || event.status === "full") && (
          <p className="mt-2 text-sm">
            Guest invite:{" "}
            <Link className="underline underline-offset-4" href={`/e/${event.slug}`}>
              /e/{event.slug}
            </Link>
          </p>
        )}
      </div>
      <CheckInBoard registrations={registrations} />
    </div>
  );
}
