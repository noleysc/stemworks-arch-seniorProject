/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db";
import { listCrmContacts, vendorGuestView } from "@/lib/experiences/crm";
import { createOwnerEvent } from "@/lib/experiences/planner";
import { revokeVendorConsent, submitRsvp } from "@/lib/experiences/rsvp";
import { eventScorecard } from "@/lib/experiences/scorecard";

const demoPayment = {
  cardholderName: "Avery Guest",
  cardNumber: "4242424242424242",
  expMonth: 12,
  expYear: 2030,
  cvc: "123",
};

const TEST_EMAILS = ["avery@example.com", "declined@example.com", "blake@example.com"];

async function resetPilot() {
  const leftover = await prisma.experienceEvent.findMany({
    where: { slug: { startsWith: "consent-test-night" } },
    select: { id: true },
  });
  const eventIds = leftover.map((row) => row.id);
  if (eventIds.length > 0) {
    await prisma.vendorConsent.deleteMany({ where: { vendor: { eventId: { in: eventIds } } } });
    await prisma.eventRegistration.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.experienceEvent.deleteMany({ where: { id: { in: eventIds } } });
  }
  await prisma.consentAudit.deleteMany({ where: { guest: { email: { in: TEST_EMAILS } } } });
  await prisma.businessCrmContact.deleteMany({
    where: {
      OR: [{ guest: { email: { in: TEST_EMAILS } } }, { businessKey: { in: ["jade_haven", "jade_flowers"] } }],
    },
  });
  await prisma.guestProfile.deleteMany({ where: { email: { in: TEST_EMAILS } } });

  return createOwnerEvent({
    title: "Consent test night",
    summary: "Ticketed evening used by architecture tests.",
    location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
    startsOn: "2026-12-18",
    startsAtLabel: "5:00 PM",
    capacity: 40,
    hostDisplayName: "The Pampered Soul",
    publish: true,
    tiers: [
      { label: "Early bird", description: "", price: 45, quantityAvailable: 20 },
      { label: "General", description: "", price: 65, quantityAvailable: 40 },
    ],
    vendors: [
      { displayName: "Jade Haven", roleLabel: "Spa partner" },
      { displayName: "Jade Flowers", roleLabel: "Florals" },
    ],
    itinerary: [{ serviceKey: "swedish-50", startsAtLabel: "6:00 PM" }],
  });
}

test("ticket purchase charges card and grants marketing consent only for that vendor", async () => {
  const event = await resetPilot();

  const result = await submitRsvp(event.slug, {
    fullName: "Avery Guest",
    email: "avery@example.com",
    phone: "239-555-0100",
    tierKey: "general",
    ticketQuantity: 2,
    notes: "",
    guestNote: "Can't wait",
    showOnGuestWall: true,
    networkOptIn: true,
    vendorOptIns: {
      jade_haven: true,
      jade_flowers: false,
    },
    payment: demoPayment,
  });

  assert.equal(result.ticketQuantity, 2);
  assert.equal(result.amountPaidCents, 13000);
  assert.equal(result.paymentLast4, "4242");
  assert.match(result.confirmationCode, /^PS-\d{4}-[A-Z0-9]+$/);

  const registration = await prisma.eventRegistration.findUniqueOrThrow({
    where: { id: result.registrationId },
  });
  assert.equal(registration.status, "confirmed");
  assert.equal(registration.paymentStatus, "paid");
  assert.ok(registration.paymentRef);

  const guest = await prisma.guestProfile.findUniqueOrThrow({ where: { id: result.guestId } });
  assert.equal(guest.email, "avery@example.com");
  assert.equal(guest.phone, "239-555-0100");

  const haven = await listCrmContacts("jade_haven");
  const flowers = await listCrmContacts("jade_flowers");
  assert.equal(haven.length, 1);
  assert.equal(haven[0].email, "avery@example.com");
  assert.equal(haven[0].phone, "239-555-0100");
  assert.equal(flowers.length, 0);

  const vendorView = await vendorGuestView(event.id, "jade_flowers");
  assert.equal(vendorView[0].email, null);
  assert.equal(vendorView[0].marketingOptIn, false);

  const scorecard = await eventScorecard(event.slug);
  assert.ok(scorecard);
  assert.equal(scorecard.ticketsSold, 2);
  assert.equal(scorecard.ticketRevenueCents, 13000);
});

test("declined demo card does not create tickets", async () => {
  const event = await resetPilot();

  await assert.rejects(
    () =>
      submitRsvp(event.slug, {
        fullName: "Declined Guest",
        email: "declined@example.com",
        phone: "239-555-0199",
        tierKey: "early-bird",
        ticketQuantity: 1,
        vendorOptIns: {},
        payment: {
          ...demoPayment,
          cardholderName: "Declined Guest",
          cardNumber: "4000000000000002",
        },
      }),
    /declined/i,
  );

  assert.equal(await prisma.eventRegistration.count({ where: { eventId: event.id } }), 0);
});

test("revoking marketing consent strips contact channels from that business CRM only", async () => {
  const event = await resetPilot();

  await submitRsvp(event.slug, {
    fullName: "Blake Guest",
    email: "blake@example.com",
    phone: "239-555-0111",
    tierKey: "early-bird",
    ticketQuantity: 1,
    networkOptIn: false,
    showOnGuestWall: false,
    vendorOptIns: {
      jade_haven: true,
      jade_flowers: true,
    },
    payment: { ...demoPayment, cardholderName: "Blake Guest" },
  });

  assert.equal((await listCrmContacts("jade_flowers")).length, 1);

  await revokeVendorConsent({ guestEmail: "blake@example.com", businessKey: "jade_flowers" });

  const flowers = await prisma.businessCrmContact.findMany({
    where: { businessKey: "jade_flowers" },
  });
  assert.equal(flowers[0].status, "revoked");
  assert.equal(flowers[0].email, null);
  assert.equal(flowers[0].phone, null);

  const haven = await listCrmContacts("jade_haven");
  assert.equal(haven.length, 1);
  assert.equal(haven[0].email, "blake@example.com");
  assert.equal(haven[0].phone, "239-555-0111");
});

test("two published events can each sell a ticket with different confirmation codes", async () => {
  const emails = ["multi-a@example.com", "multi-b@example.com"];
  const leftover = await prisma.experienceEvent.findMany({
    where: { slug: { startsWith: "multi-event-code" } },
    select: { id: true },
  });
  const eventIds = leftover.map((row) => row.id);
  if (eventIds.length > 0) {
    await prisma.vendorConsent.deleteMany({ where: { vendor: { eventId: { in: eventIds } } } });
    await prisma.eventRegistration.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.experienceEvent.deleteMany({ where: { id: { in: eventIds } } });
  }
  await prisma.consentAudit.deleteMany({ where: { guest: { email: { in: emails } } } });
  await prisma.businessCrmContact.deleteMany({ where: { guest: { email: { in: emails } } } });
  await prisma.guestProfile.deleteMany({ where: { email: { in: emails } } });

  const eventA = await createOwnerEvent({
    title: "Multi event code A",
    summary: "First published invite for confirmation uniqueness.",
    location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
    startsOn: "2026-12-20",
    startsAtLabel: "5:00 PM",
    capacity: 20,
    hostDisplayName: "The Pampered Soul",
    publish: true,
    tiers: [{ label: "General", description: "", price: 55, quantityAvailable: 20 }],
    vendors: [{ displayName: "Jade Haven", roleLabel: "Spa partner" }],
    itinerary: [{ serviceKey: "swedish-50", startsAtLabel: "6:00 PM" }],
  });
  const eventB = await createOwnerEvent({
    title: "Multi event code B",
    summary: "Second published invite for confirmation uniqueness.",
    location: "16313 S Tamiami Trail, Fort Myers, FL 33908",
    startsOn: "2026-12-21",
    startsAtLabel: "5:00 PM",
    capacity: 20,
    hostDisplayName: "The Pampered Soul",
    publish: true,
    tiers: [{ label: "General", description: "", price: 55, quantityAvailable: 20 }],
    vendors: [{ displayName: "Jade Haven", roleLabel: "Spa partner" }],
    itinerary: [{ serviceKey: "swedish-50", startsAtLabel: "6:00 PM" }],
  });

  const ticketA = await submitRsvp(eventA.slug, {
    fullName: "Multi Guest A",
    email: "multi-a@example.com",
    phone: "239-555-0201",
    tierKey: "general",
    ticketQuantity: 1,
    vendorOptIns: { jade_haven: false },
    payment: { ...demoPayment, cardholderName: "Multi Guest A" },
  });
  const ticketB = await submitRsvp(eventB.slug, {
    fullName: "Multi Guest B",
    email: "multi-b@example.com",
    phone: "239-555-0202",
    tierKey: "general",
    ticketQuantity: 1,
    vendorOptIns: { jade_haven: false },
    payment: { ...demoPayment, cardholderName: "Multi Guest B" },
  });

  assert.match(ticketA.confirmationCode, /^PS-\d{4}-[A-Z0-9]+$/);
  assert.match(ticketB.confirmationCode, /^PS-\d{4}-[A-Z0-9]+$/);
  assert.notEqual(ticketA.confirmationCode, ticketB.confirmationCode);

  const cleanupIds = [eventA.id, eventB.id];
  await prisma.vendorConsent.deleteMany({ where: { vendor: { eventId: { in: cleanupIds } } } });
  await prisma.eventRegistration.deleteMany({ where: { eventId: { in: cleanupIds } } });
  await prisma.experienceEvent.deleteMany({ where: { id: { in: cleanupIds } } });
  await prisma.consentAudit.deleteMany({ where: { guest: { email: { in: emails } } } });
  await prisma.businessCrmContact.deleteMany({ where: { guest: { email: { in: emails } } } });
  await prisma.guestProfile.deleteMany({ where: { email: { in: emails } } });
});
