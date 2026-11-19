/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { redirect } from "next/navigation";

import { getDemoSession } from "@/lib/auth/session";
import { vendorGuestView } from "@/lib/experiences/crm";
import { getEventBySlug } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export default async function VendorEventPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { business?: string };
}) {
  const { role } = getDemoSession();
  if (role !== "vendor" && role !== "owner") {
    redirect("/vendor");
  }

  const businessKey = searchParams.business || "jade_haven";
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-700">That invite could not be found.</p>
        <Link href="/vendor" className="mt-3 inline-block text-sm underline underline-offset-4">
          Back to vendor desk
        </Link>
      </div>
    );
  }

  let guests: Awaited<ReturnType<typeof vendorGuestView>> = [];
  let loadError: string | null = null;
  try {
    guests = await vendorGuestView(event.id, businessKey);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load the guest list.";
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-600">
          <Link href="/vendor" className="underline underline-offset-4">
            Vendor desk
          </Link>{" "}
          · {businessKey}
        </p>
        <h1 className="mt-1 font-display text-4xl text-stone-950">{event.title}</h1>
        <p className="mt-2 text-sm text-stone-600">
          Operational presence for every guest. Email and phone only when they opted into your marketing.
        </p>
      </div>

      {loadError ? (
        <p role="alert" className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
          {loadError}
        </p>
      ) : guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-white/80 p-6 text-sm text-stone-600">
          No guests on this invite yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {guests.map((guest) => (
            <li key={guest.registrationId} className="rounded-2xl border border-stone-900/10 bg-white/90 p-4 text-sm">
              <p className="font-medium text-stone-950">{guest.guestName}</p>
              <p className="text-stone-600">
                Party of {guest.partySize} · {guest.checkedInAt ? "Checked in" : "Not checked in"}
                {guest.marketingOptIn ? " · Marketing opt-in" : " · No marketing consent"}
              </p>
              {guest.marketingOptIn ? (
                <p className="mt-1 text-stone-700">
                  {[guest.email, guest.phone].filter(Boolean).join(" · ") || "Channels unavailable"}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
