/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { FOLLOW_UP_STATUSES, followUpStatusLabel } from "@/lib/experiences/catalog";
import { prisma } from "@/lib/db";
import { ensurePamperedEvents } from "@/lib/tenancy";

const followUpKeys = FOLLOW_UP_STATUSES.map((item) => item.key) as [string, ...string[]];

export const followUpInputSchema = z.object({
  followUpStatus: z.enum(followUpKeys),
  lastInteraction: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CrmContactRecord = {
  id: string;
  businessKey: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  followUpStatus: string;
  followUpLabel: string;
  lastInteraction: string | null;
  sourceEventId: string | null;
  createdAt: string;
};

export async function listCrmContacts(businessKey?: string): Promise<CrmContactRecord[]> {
  await ensurePamperedEvents();
  const rows = await prisma.businessCrmContact.findMany({
    where: {
      status: "active",
      ...(businessKey ? { businessKey } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    businessKey: row.businessKey,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    status: row.status,
    followUpStatus: row.followUpStatus,
    followUpLabel: followUpStatusLabel(row.followUpStatus),
    lastInteraction: row.lastInteraction,
    sourceEventId: row.sourceEventId,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function updateFollowUp(id: string, raw: z.infer<typeof followUpInputSchema>) {
  const input = followUpInputSchema.parse(raw);
  const existing = await prisma.businessCrmContact.findUnique({ where: { id } });
  if (!existing || existing.status !== "active") throw new Error("Contact not found.");
  return prisma.businessCrmContact.update({
    where: { id },
    data: {
      followUpStatus: input.followUpStatus,
      lastInteraction: input.lastInteraction?.trim() || existing.lastInteraction,
    },
  });
}

/**
 * Vendor-scoped guest visibility for an event.
 * Operational presence for everyone registered; contact channels only when opted in.
 */
export async function vendorGuestView(eventId: string, businessKey: string) {
  const vendor = await prisma.eventVendor.findFirst({
    where: { eventId, businessKey },
  });
  if (!vendor) throw new Error("Vendor is not on this event.");

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId, status: { not: "cancelled" } },
    include: {
      guest: true,
      consents: { where: { vendorId: vendor.id } },
    },
    orderBy: [{ guest: { fullName: "asc" } }],
  });

  return registrations.map((row) => {
    const consent = row.consents[0];
    const optedIn = Boolean(consent?.granted && !consent.revokedAt);
    return {
      registrationId: row.id,
      status: row.status,
      partySize: row.partySize,
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
      guestName: row.guest.fullName,
      email: optedIn ? row.guest.email : null,
      phone: optedIn ? row.guest.phone : null,
      marketingOptIn: optedIn,
    };
  });
}
