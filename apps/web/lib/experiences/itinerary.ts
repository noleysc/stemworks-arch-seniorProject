/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import { itineraryDraftSchema, resolveItineraryDraft } from "@/lib/experiences/itinerary-draft";
import { ensurePamperedEvents } from "@/lib/tenancy";
import { PublicError } from "@/lib/experiences/errors";

export const itineraryInputSchema = itineraryDraftSchema.extend({
  eventSlug: z.string().trim().min(1),
});

export type ItineraryItemRecord = {
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

async function ownedEvent(slug: string) {
  const venture = await ensurePamperedEvents();
  const event = await prisma.experienceEvent.findFirst({
    where: { slug, ventureId: venture.id },
  });
  if (!event) throw new PublicError("That invite could not be found. Refresh the invite list and try again.", 404);
  return event;
}

function toRecord(row: {
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
}): ItineraryItemRecord {
  return {
    id: row.id,
    startsAtLabel: row.startsAtLabel,
    title: row.title,
    detail: row.detail,
    placeLabel: row.placeLabel,
    emoji: row.emoji,
    serviceKey: row.serviceKey,
    durationMinutes: row.durationMinutes,
    menuPriceCents: row.menuPriceCents,
    category: row.category,
    sortOrder: row.sortOrder,
  };
}

export async function listItinerary(eventSlug: string): Promise<ItineraryItemRecord[]> {
  const event = await ownedEvent(eventSlug);
  const rows = await prisma.eventItineraryItem.findMany({
    where: { eventId: event.id },
    orderBy: [{ sortOrder: "asc" }, { startsAtLabel: "asc" }],
  });
  return rows.map(toRecord);
}

export async function createItineraryItem(raw: z.input<typeof itineraryInputSchema>) {
  const input = itineraryInputSchema.parse(raw);
  const event = await ownedEvent(input.eventSlug);
  const resolved = resolveItineraryDraft(input);
  const maxSort = await prisma.eventItineraryItem.aggregate({
    where: { eventId: event.id },
    _max: { sortOrder: true },
  });
  const row = await prisma.eventItineraryItem.create({
    data: {
      eventId: event.id,
      ...resolved,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return toRecord(row);
}

export async function deleteItineraryItem(id: string) {
  const venture = await ensurePamperedEvents();
  const existing = await prisma.eventItineraryItem.findFirst({
    where: { id, event: { ventureId: venture.id } },
  });
  if (!existing) throw new PublicError("That itinerary item is no longer available. Refresh the invite and try again.", 404);
  await prisma.eventItineraryItem.delete({ where: { id } });
  return { ok: true };
}
