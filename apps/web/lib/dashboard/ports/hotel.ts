/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { channelLabel, outletLabel, statusLabel } from "@/lib/catalog";
import type { VenturePortResult } from "@/lib/dashboard/types";
import { listBookings } from "@/lib/bookings";
import { ensureLuminary } from "@/lib/property";

const openStatuses = new Set(["inquiry", "confirmed", "arrived"]);

export async function hotelPort(
  slice: "rooms" | "dining" | "gatherings",
  businessDate: string,
  horizonDays: number,
): Promise<VenturePortResult> {
  await ensureLuminary();

  if (slice === "gatherings") {
    return {
      confirmedCents: 0,
      potentialCents: 0,
      openCount: 0,
      hasCurrentActivity: false,
      statusLabel: "No gatherings collected yet",
      topItems: [],
      attention: [],
      milestones: [],
      detailHref: "/",
    };
  }

  const bookings = await listBookings({ kind: slice === "rooms" ? "room" : "restaurant" });
  const open = bookings.filter((booking) => isOpen(booking, businessDate));

  const confirmed = open.filter((booking) => booking.status === "confirmed" || booking.status === "arrived");
  const inquiries = open.filter((booking) => booking.status === "inquiry");
  const confirmedCents = sum(confirmed);
  const potentialCents = confirmedCents + sum(inquiries);

  const topItems = [...open]
    .sort((a, b) => (b.amountCents ?? 0) - (a.amountCents ?? 0) || a.guestName.localeCompare(b.guestName))
    .slice(0, 3)
    .map((booking) => ({
      label: booking.guestName,
      stage: statusLabel(booking.status, booking.kind),
      valueCents: booking.amountCents ?? 0,
      kind: booking.channel,
    }));

  const attention =
    slice === "rooms"
      ? open
          .filter((booking) => booking.status === "confirmed" || booking.status === "arrived")
          .map((booking) => {
            const delta = dayDelta(businessDate, booking.arrivalDate);
            if (delta < 0 || delta > 3) return null;
            const body =
              delta === 0
                ? `${booking.guestName} arrives today · ${channelLabel(booking.channel)}`
                : `${booking.guestName} arrives in ${delta} days · ${channelLabel(booking.channel)}`;
            return { type: "event_milestone_due" as const, body, venture: "rooms" };
          })
          .filter((item): item is NonNullable<typeof item> => item != null)
      : open
          .filter(
            (booking) =>
              (booking.status === "confirmed" || booking.status === "arrived") && booking.arrivalDate === businessDate,
          )
          .map((booking) => ({
            type: "event_milestone_due" as const,
            body: `${booking.guestName} is seated at ${outletLabel(booking.outlet)} today`,
            venture: "dining",
          }));

  const milestones = open
    .map((booking) => {
      const dueOn = booking.arrivalDate;
      const delta = dayDelta(businessDate, dueOn);
      if (delta < 0 || delta > horizonDays) return null;
      return {
        id: booking.id,
        venture: slice,
        title:
          slice === "rooms"
            ? `${booking.guestName} arrives`
            : `${booking.guestName} · ${outletLabel(booking.outlet)}`,
        dueOn,
        kind: "event_date" as const,
        colorToken: slice,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.title.localeCompare(b.title));

  return {
    confirmedCents,
    potentialCents,
    openCount: open.length,
    hasCurrentActivity: open.length > 0,
    statusLabel: slice === "rooms" ? "243 keys · operational" : "Outlets operational",
    topItems,
    attention,
    milestones,
    detailHref: slice === "rooms" ? "/rooms" : "/restaurant",
  };
}

function isOpen(
  booking: { status: string; arrivalDate: string; departureDate: string | null; kind: string },
  businessDate: string,
) {
  if (!openStatuses.has(booking.status)) return false;
  const end = booking.kind === "room" ? (booking.departureDate ?? booking.arrivalDate) : booking.arrivalDate;
  return end >= businessDate;
}

function sum(rows: { amountCents: number | null }[]) {
  return rows.reduce((total, row) => total + (row.amountCents ?? 0), 0);
}

function dayDelta(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}
