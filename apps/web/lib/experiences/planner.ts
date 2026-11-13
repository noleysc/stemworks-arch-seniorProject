/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  DEFAULT_DISCLOSURE,
  DEFAULT_EVENT_LOCATION,
  DEFAULT_HOST_NAME,
  businessKeyFromName,
  slugifyTitle,
} from "@/lib/experiences/catalog";
import { itineraryDraftSchema, resolveItineraryDraft } from "@/lib/experiences/itinerary-draft";
import { ensurePamperedEvents } from "@/lib/tenancy";

const dollarToCents = (value: string | number) => {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new Error("Ticket price must be a number.");
  return Math.round(n * 100);
};

export const ownerEventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required.").max(160),
  summary: z.string().trim().min(1, "Tell guests what this is.").max(800),
  location: z.string().trim().min(1, "Location is required.").max(200).default(DEFAULT_EVENT_LOCATION),
  startsOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  startsAtLabel: z.string().trim().min(1, "Time is required.").max(80),
  capacity: z.coerce.number().int().min(1).max(5000),
  hostDisplayName: z.string().trim().min(1).max(120).default(DEFAULT_HOST_NAME),
  publish: z.boolean().default(false),
  tiers: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        description: z.string().trim().max(160).optional().or(z.literal("")),
        price: z.union([z.string(), z.number()]),
        quantityAvailable: z.coerce.number().int().min(1).max(10_000),
      }),
    )
    .min(1, "Add at least one ticket type."),
  vendors: z
    .array(
      z.object({
        displayName: z.string().trim().min(1).max(120),
        roleLabel: z.string().trim().max(80).optional().or(z.literal("")),
      }),
    )
    .default([]),
  itinerary: z.array(itineraryDraftSchema).default([]),
});

export async function uniqueSlug(title: string) {
  const base = slugifyTitle(title);
  let slug = base;
  let n = 2;
  while (await prisma.experienceEvent.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function createOwnerEvent(raw: z.input<typeof ownerEventSchema>) {
  const input = ownerEventSchema.parse(raw);
  const venture = await ensurePamperedEvents();
  const slug = await uniqueSlug(input.title);
  const tiers = input.tiers.map((tier, index) => ({
    key: slugifyTitle(tier.label) || `tier-${index + 1}`,
    label: tier.label,
    description: tier.description?.trim() || "",
    priceCents: dollarToCents(tier.price),
    quantityAvailable: tier.quantityAvailable,
    sortOrder: index,
    isActive: true,
  }));
  const ticketPriceCents = tiers[0]?.priceCents ?? 0;
  const usedKeys = new Set<string>();
  const uniqueBusinessKey = (name: string) => {
    const base = businessKeyFromName(name);
    let key = base;
    let n = 2;
    while (usedKeys.has(key)) {
      key = `${base}_${n}`;
      n += 1;
    }
    usedKeys.add(key);
    return key;
  };
  const hostVendors = [
    { displayName: input.hostDisplayName, roleLabel: "Host" },
    ...input.vendors.filter((vendor) => vendor.displayName.trim() !== input.hostDisplayName),
  ];

  return prisma.experienceEvent.create({
    data: {
      ventureId: venture.id,
      slug,
      title: input.title,
      summary: input.summary,
      location: input.location,
      startsOn: input.startsOn,
      endsOn: input.startsOn,
      startsAtLabel: input.startsAtLabel,
      capacity: input.capacity,
      ticketPriceCents,
      status: input.publish ? "open" : "draft",
      disclosureText: DEFAULT_DISCLOSURE,
      hostDisplayName: input.hostDisplayName,
      coverTone: "ink",
      vendors: {
        create: hostVendors.map((vendor, index) => ({
          businessKey: uniqueBusinessKey(vendor.displayName),
          displayName: vendor.displayName,
          roleLabel: vendor.roleLabel?.trim() || (index === 0 ? "Host" : "Vendor"),
          sortOrder: index,
        })),
      },
      tiers: { create: tiers },
      itineraryItems: {
        create: input.itinerary.map((item, index) => ({
          ...resolveItineraryDraft(item),
          sortOrder: index,
        })),
      },
    },
  });
}

export async function publishEvent(slug: string) {
  const event = await prisma.experienceEvent.findUnique({
    where: { slug },
    include: { tiers: true },
  });
  if (!event) throw new Error("Event not found.");
  if (event.tiers.length === 0) throw new Error("Add a ticket type before publishing.");
  if (event.status === "cancelled") throw new Error("Cancelled invites cannot be published.");
  return prisma.experienceEvent.update({
    where: { id: event.id },
    data: { status: "open" },
  });
}

export async function unpublishEvent(slug: string) {
  const event = await prisma.experienceEvent.findUnique({ where: { slug } });
  if (!event) throw new Error("Event not found.");
  if (event.status !== "open" && event.status !== "full") {
    throw new Error("Only a published invite can be unpublished.");
  }
  return prisma.experienceEvent.update({
    where: { id: event.id },
    data: { status: "draft" },
  });
}

export async function cancelEvent(slug: string) {
  const event = await prisma.experienceEvent.findUnique({ where: { slug } });
  if (!event) throw new Error("Event not found.");
  if (event.status === "cancelled") return event;
  return prisma.experienceEvent.update({
    where: { id: event.id },
    data: { status: "cancelled" },
  });
}

export const updateOwnerEventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required.").max(160),
  summary: z.string().trim().min(1, "Tell guests what this is.").max(800),
  location: z.string().trim().min(1, "Location is required.").max(200),
  startsOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  startsAtLabel: z.string().trim().min(1, "Time is required.").max(80),
  capacity: z.coerce.number().int().min(1).max(5000),
  hostDisplayName: z.string().trim().min(1).max(120),
  tiers: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().trim().min(1).max(80),
        description: z.string().trim().max(160).optional().or(z.literal("")),
        price: z.union([z.string(), z.number()]),
        quantityAvailable: z.coerce.number().int().min(1).max(10_000),
      }),
    )
    .min(1, "Add at least one ticket type."),
});

export async function updateOwnerEvent(slug: string, raw: z.input<typeof updateOwnerEventSchema>) {
  const input = updateOwnerEventSchema.parse(raw);
  const event = await prisma.experienceEvent.findUnique({
    where: { slug },
    include: {
      tiers: true,
      registrations: { select: { tierId: true, ticketQuantity: true, status: true } },
    },
  });
  if (!event) throw new Error("Event not found.");
  if (event.status === "cancelled") throw new Error("Cancelled invites cannot be edited.");

  const soldByTier = new Map<string, number>();
  for (const registration of event.registrations) {
    if (!registration.tierId) continue;
    if (registration.status === "cancelled") continue;
    soldByTier.set(
      registration.tierId,
      (soldByTier.get(registration.tierId) ?? 0) + registration.ticketQuantity,
    );
  }

  const incomingIds = new Set(input.tiers.map((tier) => tier.id).filter(Boolean));
  for (const existing of event.tiers) {
    const sold = soldByTier.get(existing.id) ?? 0;
    if (!incomingIds.has(existing.id) && sold > 0) {
      throw new Error(`Cannot remove “${existing.label}” — ${sold} ticket(s) already sold.`);
    }
  }

  const usedKeys = new Set(
    event.tiers.filter((tier) => incomingIds.has(tier.id)).map((tier) => tier.key),
  );
  const uniqueTierKey = (label: string) => {
    const base = slugifyTitle(label) || "tier";
    let key = base;
    let n = 2;
    while (usedKeys.has(key)) {
      key = `${base}-${n}`;
      n += 1;
    }
    usedKeys.add(key);
    return key;
  };

  const tiersPayload = input.tiers.map((tier, index) => {
    const priceCents = dollarToCents(tier.price);
    const sold = tier.id ? soldByTier.get(tier.id) ?? 0 : 0;
    if (tier.quantityAvailable < sold) {
      throw new Error(
        `“${tier.label}” quantity must be at least ${sold} (already sold).`,
      );
    }
    return {
      id: tier.id,
      key: tier.id
        ? event.tiers.find((row) => row.id === tier.id)?.key ?? uniqueTierKey(tier.label)
        : uniqueTierKey(tier.label),
      label: tier.label,
      description: tier.description?.trim() || "",
      priceCents,
      quantityAvailable: tier.quantityAvailable,
      sortOrder: index,
      isActive: true,
    };
  });

  const removeIds = event.tiers
    .filter((tier) => !incomingIds.has(tier.id))
    .map((tier) => tier.id);

  await prisma.$transaction(async (tx) => {
    await tx.experienceEvent.update({
      where: { id: event.id },
      data: {
        title: input.title,
        summary: input.summary,
        location: input.location,
        startsOn: input.startsOn,
        endsOn: input.startsOn,
        startsAtLabel: input.startsAtLabel,
        capacity: input.capacity,
        hostDisplayName: input.hostDisplayName,
        ticketPriceCents: tiersPayload[0]?.priceCents ?? event.ticketPriceCents,
      },
    });

    if (removeIds.length > 0) {
      await tx.ticketTier.deleteMany({ where: { id: { in: removeIds }, eventId: event.id } });
    }

    for (const tier of tiersPayload) {
      if (tier.id) {
        await tx.ticketTier.update({
          where: { id: tier.id },
          data: {
            label: tier.label,
            description: tier.description,
            priceCents: tier.priceCents,
            quantityAvailable: tier.quantityAvailable,
            sortOrder: tier.sortOrder,
            isActive: true,
          },
        });
      } else {
        await tx.ticketTier.create({
          data: {
            eventId: event.id,
            key: tier.key,
            label: tier.label,
            description: tier.description,
            priceCents: tier.priceCents,
            quantityAvailable: tier.quantityAvailable,
            sortOrder: tier.sortOrder,
            isActive: true,
          },
        });
      }
    }
  });

  return prisma.experienceEvent.findUniqueOrThrow({ where: { id: event.id } });
}
