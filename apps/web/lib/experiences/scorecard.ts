/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { prisma } from "@/lib/db";
import { getPrimaryEvent } from "@/lib/experiences/events";

export type EventScorecard = {
  eventId: string;
  slug: string;
  title: string;
  startsOn: string;
  capacity: number;
  registrations: number;
  ticketsSold: number;
  attendance: number;
  checkInRate: number | null;
  ticketRevenueCents: number;
  potentialTicketCents: number;
  optInsByVendor: { businessKey: string; displayName: string; optIns: number }[];
  followUpQueued: number;
  followUpSent: number;
  consentAudits: number;
  tiers: { key: string; label: string; sold: number; remaining: number; revenueCents: number }[];
};

export async function eventScorecard(slug?: string): Promise<EventScorecard | null> {
  const fallback = slug ? null : await getPrimaryEvent();
  const lookup = slug ?? fallback?.slug;
  if (!lookup) return null;

  const event = await prisma.experienceEvent.findUnique({
    where: { slug: lookup },
    include: {
      vendors: { orderBy: { sortOrder: "asc" } },
      tiers: { orderBy: { sortOrder: "asc" } },
      registrations: {
        include: { consents: true, tier: true },
      },
    },
  });
  if (!event) return null;

  const active = event.registrations.filter((reg) => reg.status !== "cancelled");
  const attended = active.filter((reg) => reg.status === "attended");
  const ticketsSold = active.reduce((sum, reg) => sum + reg.ticketQuantity, 0);
  const ticketRevenueCents = active.reduce((sum, reg) => sum + reg.amountPaidCents, 0);
  const general = event.tiers[0];
  const remainingSeats = Math.max(0, event.capacity - ticketsSold);
  const potentialTicketCents =
    ticketRevenueCents + remainingSeats * (general?.priceCents ?? event.ticketPriceCents);

  const optInsByVendor = event.vendors.map((vendor) => {
    const optIns = active.filter((reg) =>
      reg.consents.some((consent) => consent.vendorId === vendor.id && consent.granted && !consent.revokedAt),
    ).length;
    return {
      businessKey: vendor.businessKey,
      displayName: vendor.displayName,
      optIns,
    };
  });

  const crm = await prisma.businessCrmContact.findMany({
    where: { sourceEventId: event.id, status: "active" },
    select: { followUpStatus: true },
  });

  const consentAudits = await prisma.consentAudit.count({
    where: { businessKey: { in: event.vendors.map((vendor) => vendor.businessKey) } },
  });

  const tiers = event.tiers.map((tier) => {
    const soldRows = active.filter((reg) => reg.tierId === tier.id);
    const sold = soldRows.reduce((sum, reg) => sum + reg.ticketQuantity, 0);
    const revenueCents = soldRows.reduce((sum, reg) => sum + reg.amountPaidCents, 0);
    return {
      key: tier.key,
      label: tier.label,
      sold,
      remaining: Math.max(0, tier.quantityAvailable - sold),
      revenueCents,
    };
  });

  return {
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    startsOn: event.startsOn,
    capacity: event.capacity,
    registrations: active.length,
    ticketsSold,
    attendance: attended.length,
    checkInRate: active.length === 0 ? null : attended.length / active.length,
    ticketRevenueCents,
    potentialTicketCents,
    optInsByVendor,
    followUpQueued: crm.filter((row) => row.followUpStatus === "queued").length,
    followUpSent: crm.filter((row) => row.followUpStatus === "sent" || row.followUpStatus === "replied").length,
    consentAudits,
    tiers,
  };
}

export function projectExperienceCents(scorecard: EventScorecard) {
  return {
    confirmedCents: scorecard.ticketRevenueCents,
    potentialCents: Math.max(scorecard.potentialTicketCents, scorecard.ticketRevenueCents),
    openCount: scorecard.ticketsSold,
  };
}
