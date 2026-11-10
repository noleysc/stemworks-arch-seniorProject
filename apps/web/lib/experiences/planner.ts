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
  return prisma.experienceEvent.update({
    where: { id: event.id },
    data: { status: "open" },
  });
}
