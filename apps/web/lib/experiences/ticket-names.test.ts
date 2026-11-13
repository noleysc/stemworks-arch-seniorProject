/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "@/app/api/experiences/events/route";
import { PATCH } from "@/app/api/experiences/events/[slug]/route";
import { prisma } from "@/lib/db";
import { createOwnerEvent, ownerEventSchema, updateOwnerEvent, updateOwnerEventSchema } from "./planner";

const duplicateMessage = "Ticket types must have different names. Rename the duplicate ticket type.";
const details = {
  title: "Ticket name validation test",
  summary: "Disposable ticket-name validation regression test.",
  location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
  startsOn: "2026-12-18",
  startsAtLabel: "5:00 PM",
  capacity: 24,
  hostDisplayName: "The Pampered Soul",
};

function ticket(label: string) {
  return { label, price: 65, quantityAvailable: 10 };
}

for (const [description, labels] of [
  ["identical", ["VIP", "VIP"]],
  ["case and surrounding spaces", ["VIP", " vip "]],
  ["punctuation", ["VIP!", "vip"]],
  ["internal spaces", ["General   admission", "general-admission"]],
  ["truncation", [`${"a".repeat(60)}-one`, `${"a".repeat(60)}-two`]],
] as const) {
  test(`create and edit reject ticket-name collisions from ${description}`, () => {
    for (const schema of [ownerEventSchema, updateOwnerEventSchema]) {
      const result = schema.safeParse({ ...details, tiers: labels.map(ticket) });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error.issues[0].message, duplicateMessage);
        assert.deepEqual(result.error.issues[0].path, ["tiers", 1, "label"]);
      }
    }
  });
}

test("valid distinct names, free tiers, and edit IDs remain accepted", () => {
  const tiers = [{ ...ticket(" General admission "), price: 0, id: "existing-tier" }, ticket("VIP")];
  assert.equal(ownerEventSchema.parse({ ...details, tiers }).tiers[0].label, "General admission");
  assert.equal(updateOwnerEventSchema.parse({ ...details, tiers }).tiers[0].id, "existing-tier");
});

test("creation and editing APIs return the duplicate-name instruction as plain text", async () => {
  const body = { ...details, tiers: [ticket("VIP"), ticket("VIP!")] };
  const request = () => new Request("http://localhost/api/experiences/events", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  for (const response of [await POST(request()), await PATCH(request(), { params: { slug: "validation-fails-before-lookup" } })]) {
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: duplicateMessage });
  }
});

test("duplicate-name creation leaves no partial event", async () => {
  const title = "Ticket name rejected creation regression";
  await assert.rejects(() => createOwnerEvent({ ...details, title, tiers: [ticket("VIP"), ticket("VIP!")] }), /Ticket types must have different names/);
  assert.equal(await prisma.experienceEvent.count({ where: { title } }), 0);
});

test("editing rejects duplicates atomically and preserves sold-tier identity and restrictions", async () => {
  const event = await createOwnerEvent({ ...details, title: "Ticket name sold-tier regression", tiers: [ticket("General"), ticket("VIP")] });
  let guestId: string | null = null;
  try {
    const tiers = await prisma.ticketTier.findMany({ where: { eventId: event.id }, orderBy: { sortOrder: "asc" } });
    const guest = await prisma.guestProfile.create({ data: { email: `ticket-name-${event.id}@example.com`, fullName: "Ticket Name Test Guest" } });
    guestId = guest.id;
    const registration = await prisma.eventRegistration.create({
      data: { eventId: event.id, guestId, tierId: tiers[1].id, status: "confirmed", ticketQuantity: 2, partySize: 2 },
    });
    const snapshot = () => prisma.experienceEvent.findUniqueOrThrow({
      where: { id: event.id }, include: { tiers: { orderBy: { sortOrder: "asc" } }, registrations: true },
    });
    const before = await snapshot();
    for (const labels of [["General", "General!"], ["VIP", "vip"]]) {
      await assert.rejects(() => updateOwnerEvent(event.slug, {
        ...details, title: "Must not be saved", capacity: 100,
        tiers: tiers.map((tier, index) => ({ ...ticket(labels[index]), id: tier.id, price: 200 })),
      }), /Ticket types must have different names/);
      assert.deepEqual(await snapshot(), before);
    }

    const validTiers = tiers.map((tier, index) => ({ ...ticket(index === 1 ? "Premium" : tier.label), id: tier.id }));
    await updateOwnerEvent(event.slug, { ...details, tiers: validTiers });
    const renamed = await snapshot();
    assert.equal(renamed.tiers[1].label, "Premium");
    assert.equal(renamed.tiers[1].id, tiers[1].id);
    assert.equal(renamed.tiers[1].key, tiers[1].key);
    assert.equal(renamed.registrations[0].id, registration.id);
    assert.equal(renamed.registrations[0].tierId, tiers[1].id);

    await assert.rejects(() => updateOwnerEvent(event.slug, {
      ...details, tiers: validTiers.map((tier, index) => index === 1 ? { ...tier, quantityAvailable: 1 } : tier),
    }), /quantity must be at least 2/);
    await assert.rejects(() => updateOwnerEvent(event.slug, { ...details, tiers: [validTiers[0]] }), /Cannot remove/);
    assert.deepEqual(await snapshot(), renamed);
  } finally {
    await prisma.experienceEvent.delete({ where: { id: event.id } });
    if (guestId) await prisma.guestProfile.delete({ where: { id: guestId } });
  }
});
