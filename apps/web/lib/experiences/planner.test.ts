/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db";
import { getEventBySlug } from "@/lib/experiences/events";
import { createItineraryItem } from "@/lib/experiences/itinerary";
import { createOwnerEvent } from "@/lib/experiences/planner";
import { requireSpaService } from "@/lib/experiences/spa-menu";

test("planner stamps Pampered Soul menu items onto the event itinerary", async () => {
  const swedish = requireSpaService("swedish-50");
  const event = await createOwnerEvent({
    title: "Spa menu architecture night",
    summary: "Owner picks treatments from the Fort Myers spa menu.",
    location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
    startsOn: "2026-12-18",
    startsAtLabel: "5:00 PM",
    capacity: 24,
    publish: true,
    tiers: [{ label: "General admission", price: 65, quantityAvailable: 24 }],
    itinerary: [
      { serviceKey: "swedish-50", startsAtLabel: "6:00 PM" },
      { serviceKey: "lymphatic-50" },
      { title: "Welcome tea", startsAtLabel: "5:00 PM" },
    ],
  });

  const record = await getEventBySlug(event.slug);
  assert.ok(record);
  assert.equal(record.itinerary.length, 3);

  const swedishItem = record.itinerary.find((item) => item.serviceKey === "swedish-50");
  assert.ok(swedishItem);
  assert.equal(swedishItem.title, swedish.title);
  assert.equal(swedishItem.durationMinutes, 50);
  assert.equal(swedishItem.menuPriceCents, 9000);
  assert.equal(swedishItem.startsAtLabel, "6:00 PM");
  assert.equal(swedishItem.category, "massage");

  const lymphatic = record.itinerary.find((item) => item.serviceKey === "lymphatic-50");
  assert.ok(lymphatic);
  assert.equal(lymphatic.startsAtLabel, "Throughout");
  assert.equal(lymphatic.menuPriceCents, 11000);

  const moment = record.itinerary.find((item) => item.title === "Welcome tea");
  assert.ok(moment);
  assert.equal(moment.serviceKey, null);
  assert.equal(moment.category, "moment");

  const added = await createItineraryItem({
    eventSlug: event.slug,
    serviceKey: "combo-90",
    startsAtLabel: "7:30 PM",
  });
  assert.equal(added.title, "Massage + Facial Combo");
  assert.equal(added.durationMinutes, 90);
  assert.equal(added.menuPriceCents, 15000);

  await prisma.eventItineraryItem.deleteMany({ where: { eventId: event.id } });
  await prisma.ticketTier.deleteMany({ where: { eventId: event.id } });
  await prisma.eventVendor.deleteMany({ where: { eventId: event.id } });
  await prisma.experienceEvent.delete({ where: { id: event.id } });
});

test("unknown spa service keys are rejected", async () => {
  await assert.rejects(
    () =>
      createOwnerEvent({
        title: "Bad menu key",
        summary: "Should not save.",
        location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
        startsOn: "2026-12-18",
        startsAtLabel: "5:00 PM",
        capacity: 10,
        tiers: [{ label: "GA", price: 10, quantityAvailable: 10 }],
        itinerary: [{ serviceKey: "not-a-real-service" }],
      }),
    /Unknown spa service/,
  );
});

test("owner can update invite copy, unpublish, and cancel", async () => {
  const { updateOwnerEvent, unpublishEvent, cancelEvent, publishEvent } = await import(
    "@/lib/experiences/planner"
  );

  const created = await createOwnerEvent({
    title: "Edit flow night",
    summary: "Starting summary.",
    location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
    startsOn: "2026-12-20",
    startsAtLabel: "6:00 PM",
    capacity: 20,
    publish: true,
    tiers: [
      { label: "General admission", price: 55, quantityAvailable: 20 },
      { label: "VIP", price: 120, quantityAvailable: 4 },
    ],
  });

  const event = await getEventBySlug(created.slug);
  assert.ok(event);
  assert.equal(event.status, "open");
  const general = event.tiers.find((tier) => tier.label === "General admission");
  assert.ok(general);

  await updateOwnerEvent(event.slug, {
    title: "Edited invite night",
    summary: "Updated for guests.",
    location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
    startsOn: "2026-12-21",
    startsAtLabel: "7:00 PM",
    capacity: 30,
    hostDisplayName: "The Pampered Soul",
    tiers: [
      {
        id: general.id,
        label: "General admission",
        description: "Evening access",
        price: 60,
        quantityAvailable: 28,
      },
      {
        label: "Couple",
        price: 95,
        quantityAvailable: 6,
      },
    ],
  });

  const updated = await getEventBySlug(event.slug);
  assert.ok(updated);
  assert.equal(updated.title, "Edited invite night");
  assert.equal(updated.startsOn, "2026-12-21");
  assert.equal(updated.startsAtLabel, "7:00 PM");
  assert.equal(updated.capacity, 30);
  assert.equal(updated.tiers.length, 2);
  assert.equal(updated.tiers.find((tier) => tier.label === "General admission")?.priceCents, 6000);
  assert.ok(updated.tiers.some((tier) => tier.label === "Couple"));

  await unpublishEvent(event.slug);
  const draft = await getEventBySlug(event.slug);
  assert.equal(draft?.status, "draft");

  await publishEvent(event.slug);
  await cancelEvent(event.slug);
  const cancelled = await getEventBySlug(event.slug);
  assert.equal(cancelled?.status, "cancelled");

  await prisma.ticketTier.deleteMany({ where: { eventId: event.id } });
  await prisma.eventVendor.deleteMany({ where: { eventId: event.id } });
  await prisma.experienceEvent.delete({ where: { id: event.id } });
});
