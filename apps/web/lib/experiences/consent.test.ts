/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db";
import { HOLIDAY_EVENT } from "@/lib/experiences/catalog";
import { listCrmContacts, vendorGuestView } from "@/lib/experiences/crm";
import { ensureHolidayPilotEvent } from "@/lib/experiences/events";
import { revokeVendorConsent, submitRsvp } from "@/lib/experiences/rsvp";
import { eventScorecard } from "@/lib/experiences/scorecard";

const demoPayment = {
  cardholderName: "Avery Guest",
  cardNumber: "4242424242424242",
  expMonth: 12,
  expYear: 2030,
  cvc: "123",
};

async function resetPilot() {
  const event = await ensureHolidayPilotEvent();
  await prisma.consentAudit.deleteMany({});
  await prisma.vendorConsent.deleteMany({});
  await prisma.businessCrmContact.deleteMany({});
  await prisma.eventRegistration.deleteMany({ where: { eventId: event.id } });
  await prisma.guestProfile.deleteMany({});
  await prisma.experienceEvent.update({
    where: { id: event.id },
    data: { status: "open" },
  });
  return event;
}

test("ticket purchase charges card and grants marketing consent only for that vendor", async () => {
  const event = await resetPilot();

  const result = await submitRsvp(HOLIDAY_EVENT.slug, {
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
      charcuterie_co: false,
    },
    payment: demoPayment,
  });

  assert.equal(result.ticketQuantity, 2);
  assert.equal(result.amountPaidCents, 13000);
  assert.equal(result.paymentLast4, "4242");
  assert.match(result.confirmationCode, /^JE-\d{4}-\d{4}$/);

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

  const scorecard = await eventScorecard();
  assert.equal(scorecard.ticketsSold, 2);
  assert.equal(scorecard.ticketRevenueCents, 13000);
});

test("declined demo card does not create tickets", async () => {
  await resetPilot();

  await assert.rejects(
    () =>
      submitRsvp(HOLIDAY_EVENT.slug, {
        fullName: "Declined Guest",
        email: "declined@example.com",
        phone: "239-555-0199",
        tierKey: "early_bird",
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

  assert.equal(await prisma.eventRegistration.count(), 0);
});

test("revoking marketing consent strips contact channels from that business CRM only", async () => {
  await resetPilot();

  await submitRsvp(HOLIDAY_EVENT.slug, {
    fullName: "Blake Guest",
    email: "blake@example.com",
    phone: "239-555-0111",
    tierKey: "early_bird",
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
