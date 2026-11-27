/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db";
import {
  bookServiceAppointment,
  cancelAppointment,
  collectAppointmentPayment,
  importMassageBookCsv,
  listAppointments,
  listSpaClients,
  rescheduleAppointment,
  spaAppointmentReport,
  updateAppointment,
} from "@/lib/experiences/appointments";

async function cleanupEmail(email: string) {
  await prisma.serviceAppointment.deleteMany({ where: { clientEmail: email } });
  await prisma.consentAudit.deleteMany({ where: { guest: { email } } });
  await prisma.businessCrmContact.deleteMany({ where: { guest: { email } } });
  await prisma.guestProfile.deleteMany({ where: { email } });
}

test("clients can book an individual spa service", async () => {
  const email = "casey-book@example.com";
  await cleanupEmail(email);

  const appointment = await bookServiceAppointment({
    serviceKey: "swedish-50",
    appointmentOn: "2026-12-22",
    startsAtLabel: "2:00 PM",
    clientName: "Casey Client",
    clientEmail: email,
    clientPhone: "239-555-0300",
    notes: "Focus on shoulders",
    payLater: true,
  });

  assert.equal(appointment.serviceTitle, "50 min Swedish Massage");
  assert.equal(appointment.priceCents, 9000);
  assert.equal(appointment.status, "booked");
  assert.equal(appointment.paymentStatus, "unpaid");
  assert.match(appointment.confirmationCode ?? "", /^SA-\d{4}-/);

  const listed = await listAppointments({ from: "2026-12-22", to: "2026-12-22" });
  assert.ok(listed.some((row) => row.id === appointment.id));

  await cleanupEmail(email);
});

test("paid public booking charges the card and marks the appointment paid", async () => {
  const email = "casey-pay@example.com";
  await cleanupEmail(email);

  const appointment = await bookServiceAppointment({
    serviceKey: "swedish-50",
    appointmentOn: "2026-12-28",
    startsAtLabel: "4:00 PM",
    clientName: "Casey Pay",
    clientEmail: email,
    clientPhone: "239-555-0310",
    payment: {
      cardholderName: "Casey Pay",
      cardNumber: "4242424242424242",
      expMonth: 12,
      expYear: 2030,
      cvc: "123",
    },
  });

  assert.equal(appointment.paymentStatus, "paid");
  assert.equal(appointment.amountPaidCents, 9000);
  assert.equal(appointment.status, "confirmed");
  assert.equal(appointment.paymentLast4, "4242");
  assert.match(appointment.paymentRef ?? "", /^pay_demo_/);

  await cleanupEmail(email);
});

test("staff can reschedule, collect payment, complete, and cancel spa appointments", async () => {
  const email = "spa-lifecycle@example.com";
  await cleanupEmail(email);

  const booked = await bookServiceAppointment({
    serviceKey: "swedish-50",
    appointmentOn: "2026-12-23",
    startsAtLabel: "10:00 AM",
    clientName: "Lifecycle Client",
    clientEmail: email,
    clientPhone: "239-555-0400",
    preferences: "Medium pressure",
    therapistLabel: "Tabatha",
    payLater: true,
  });

  const moved = await rescheduleAppointment(booked.id, {
    appointmentOn: "2026-12-24",
    startsAtLabel: "11:00 AM",
  });
  assert.equal(moved.appointmentOn, "2026-12-24");
  assert.equal(moved.startsAtLabel, "11:00 AM");

  const paid = await collectAppointmentPayment(booked.id, {
    kind: "deposit",
    method: "manual",
    amountCents: 2500,
  });
  assert.equal(paid.paymentStatus, "deposit");
  assert.equal(paid.amountPaidCents, 2500);
  assert.equal(paid.status, "confirmed");

  const completed = await updateAppointment(booked.id, {
    status: "completed",
    markConfirmationSent: true,
  });
  assert.equal(completed.status, "completed");
  assert.ok(completed.confirmationSentAt);

  const cancelled = await cancelAppointment(booked.id);
  assert.equal(cancelled.status, "cancelled");

  const clients = await listSpaClients("lifecycle");
  assert.ok(clients.some((client) => client.email === email));

  const report = await spaAppointmentReport({ from: "2026-12-23", to: "2026-12-25" });
  assert.ok(report.totalAppointments >= 1);

  await cleanupEmail(email);
});

test("booking rejects overlapping active appointments", async () => {
  const emailA = "overlap-a@example.com";
  const emailB = "overlap-b@example.com";
  await cleanupEmail(emailA);
  await cleanupEmail(emailB);

  await bookServiceAppointment({
    serviceKey: "swedish-50",
    appointmentOn: "2026-12-26",
    startsAtLabel: "1:00 PM",
    clientName: "First Client",
    clientEmail: emailA,
    clientPhone: "239-555-0500",
    payLater: true,
  });

  await assert.rejects(
    () =>
      bookServiceAppointment({
        serviceKey: "mini-20",
        appointmentOn: "2026-12-26",
        startsAtLabel: "1:00 PM",
        clientName: "Second Client",
        clientEmail: emailB,
        clientPhone: "239-555-0501",
        payLater: true,
      }),
    /overlaps/i,
  );

  await cleanupEmail(emailA);
  await cleanupEmail(emailB);
});

test("MassageBook CSV import creates spa appointments", async () => {
  const email = "import-client@example.com";
  await cleanupEmail(email);

  const csv = [
    "client_name,email,phone,service_key,date,time,price,status,notes,preferences,therapist",
    "Import Client,import-client@example.com,239-555-0600,swedish-50,2026-12-27,3:00 PM,90.00,booked,Neck,Soft,Tabatha",
  ].join("\n");

  const result = await importMassageBookCsv(csv);
  assert.equal(result.created, 1);
  assert.equal(result.skipped, 0);

  const listed = await listAppointments({ from: "2026-12-27", to: "2026-12-27" });
  assert.ok(listed.some((row) => row.clientEmail === email && row.therapistLabel === "Tabatha"));

  await cleanupEmail(email);
});
