/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { eventStatusLabel, wallFirstName } from "@/lib/experiences/catalog";
import { prisma } from "@/lib/db";
import { ensurePamperedEvents } from "@/lib/tenancy";

export type TicketTierRecord = {
  id: string;
  key: string;
  label: string;
  description: string;
  priceCents: number;
  quantityAvailable: number;
  quantitySold: number;
  remaining: number;
  sortOrder: number;
  isActive: boolean;
};

export type ItineraryBlock = {
  id: string;
  startsAtLabel: string;
  title: string;
  detail: string | null;
  placeLabel: string | null;
  emoji: string | null;
  serviceKey: string | null;
  durationMinutes: number | null;
  menuPriceCents: number | null;
  category: string | null;
  sortOrder: number;
};

export type ExperienceEventRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  location: string;
  startsOn: string;
  endsOn: string | null;
  startsAtLabel: string | null;
  capacity: number;
  ticketPriceCents: number;
  status: string;
  statusLabel: string;
  disclosureText: string;
  hostDisplayName: string;
  registeredCount: number;
  ticketCount: number;
  attendedCount: number;
  goingCount: number;
  vendors: {
    id: string;
    businessKey: string;
    displayName: string;
    roleLabel: string;
    sortOrder: number;
  }[];
  tiers: TicketTierRecord[];
  itinerary: ItineraryBlock[];
};

export type GuestWallEntry = {
  wallName: string;
  guestNote: string | null;
  ticketQuantity: number;
};

const eventInclude = {
  vendors: { orderBy: { sortOrder: "asc" as const } },
  tiers: { orderBy: { sortOrder: "asc" as const } },
  itineraryItems: { orderBy: { sortOrder: "asc" as const } },
  registrations: {
    select: {
      status: true,
      ticketQuantity: true,
      amountPaidCents: true,
      tierId: true,
    },
  },
};

export async function getEventBySlug(slug: string): Promise<ExperienceEventRecord | null> {
  const row = await prisma.experienceEvent.findUnique({
    where: { slug },
    include: eventInclude,
  });
  if (!row) return null;
  return toRecord(row);
}

export async function listExperienceEvents(): Promise<ExperienceEventRecord[]> {
  const venture = await ensurePamperedEvents();
  const rows = await prisma.experienceEvent.findMany({
    where: { ventureId: venture.id },
    include: eventInclude,
    orderBy: [{ startsOn: "asc" }],
  });
  return rows.map(toRecord);
}

export async function getPrimaryEvent(): Promise<ExperienceEventRecord | null> {
  const events = await listExperienceEvents();
  return events.find((event) => event.status === "open" || event.status === "full") ?? events[0] ?? null;
}

export async function listGuestWall(eventId: string): Promise<GuestWallEntry[]> {
  const rows = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      showOnGuestWall: true,
      status: { in: ["registered", "confirmed", "attended"] },
    },
    include: { guest: true },
    orderBy: [{ createdAt: "desc" }],
    take: 48,
  });
  return rows.map((row) => ({
    wallName: row.wallName || wallFirstName(row.guest.fullName),
    guestNote: row.guestNote,
    ticketQuantity: row.ticketQuantity,
  }));
}

export async function listRegistrations(eventId: string) {
  const rows = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      guest: true,
      tier: true,
      consents: { include: { vendor: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    partySize: row.partySize,
    ticketQuantity: row.ticketQuantity,
    amountPaidCents: row.amountPaidCents,
    confirmationCode: row.confirmationCode,
    notes: row.notes,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    tierLabel: row.tier?.label ?? null,
    guest: {
      id: row.guest.id,
      fullName: row.guest.fullName,
      email: row.guest.email,
      phone: row.guest.phone,
    },
    consents: row.consents.map((consent) => ({
      vendorId: consent.vendorId,
      businessKey: consent.vendor.businessKey,
      displayName: consent.vendor.displayName,
      granted: consent.granted && !consent.revokedAt,
      channelScope: consent.channelScope,
    })),
  }));
}

export async function checkInRegistration(registrationId: string) {
  const row = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
  if (!row) throw new Error("Registration not found.");
  if (row.status === "cancelled") throw new Error("Cancelled guests cannot be checked in.");
  return prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: "attended", checkedInAt: new Date() },
  });
}

function toRecord(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  location: string;
  startsOn: string;
  endsOn: string | null;
  startsAtLabel: string | null;
  capacity: number;
  ticketPriceCents: number;
  status: string;
  disclosureText: string;
  hostDisplayName: string;
  vendors: { id: string; businessKey: string; displayName: string; roleLabel: string; sortOrder: number }[];
  tiers: {
    id: string;
    key: string;
    label: string;
    description: string;
    priceCents: number;
    quantityAvailable: number;
    sortOrder: number;
    isActive: boolean;
  }[];
  itineraryItems?: {
    id: string;
    startsAtLabel: string;
    title: string;
    detail: string | null;
    placeLabel: string | null;
    emoji: string | null;
    serviceKey: string | null;
    durationMinutes: number | null;
    menuPriceCents: number | null;
    category: string | null;
    sortOrder: number;
  }[];
  registrations: {
    status: string;
    ticketQuantity: number;
    amountPaidCents: number;
    tierId: string | null;
  }[];
}): ExperienceEventRecord {
  const active = row.registrations.filter((reg) => reg.status !== "cancelled");
  const attended = row.registrations.filter((reg) => reg.status === "attended");
  const ticketCount = active.reduce((sum, reg) => sum + reg.ticketQuantity, 0);
  const soldByTier = new Map<string, number>();
  for (const reg of active) {
    if (!reg.tierId) continue;
    soldByTier.set(reg.tierId, (soldByTier.get(reg.tierId) ?? 0) + reg.ticketQuantity);
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    location: row.location,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    startsAtLabel: row.startsAtLabel,
    capacity: row.capacity,
    ticketPriceCents: row.ticketPriceCents,
    status: row.status,
    statusLabel: eventStatusLabel(row.status),
    disclosureText: row.disclosureText,
    hostDisplayName: row.hostDisplayName,
    registeredCount: active.length,
    ticketCount,
    attendedCount: attended.length,
    goingCount: active.length,
    vendors: row.vendors,
    itinerary: (row.itineraryItems ?? []).map((item) => ({
      id: item.id,
      startsAtLabel: item.startsAtLabel,
      title: item.title,
      detail: item.detail,
      placeLabel: item.placeLabel,
      emoji: item.emoji,
      serviceKey: item.serviceKey,
      durationMinutes: item.durationMinutes,
      menuPriceCents: item.menuPriceCents,
      category: item.category,
      sortOrder: item.sortOrder,
    })),
    tiers: row.tiers.map((tier) => {
      const quantitySold = soldByTier.get(tier.id) ?? 0;
      return {
        id: tier.id,
        key: tier.key,
        label: tier.label,
        description: tier.description,
        priceCents: tier.priceCents,
        quantityAvailable: tier.quantityAvailable,
        quantitySold,
        remaining: Math.max(0, tier.quantityAvailable - quantitySold),
        sortOrder: tier.sortOrder,
        isActive: tier.isActive,
      };
    }),
  };
}
