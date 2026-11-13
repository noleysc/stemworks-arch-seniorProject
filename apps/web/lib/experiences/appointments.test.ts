/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db";
import { bookServiceAppointment, listAppointments } from "@/lib/experiences/appointments";

test("clients can book an individual spa service", async () => {
  const appointment = await bookServiceAppointment({
    serviceKey: "swedish-50",
    appointmentOn: "2026-12-22",
    startsAtLabel: "2:00 PM",
    clientName: "Casey Client",
    clientEmail: "casey-book@example.com",
    clientPhone: "239-555-0300",
    notes: "Focus on shoulders",
  });

  assert.equal(appointment.serviceTitle, "50 min Swedish Massage");
  assert.equal(appointment.priceCents, 9000);
  assert.equal(appointment.status, "booked");
  assert.match(appointment.confirmationCode ?? "", /^SA-\d{4}-/);

  const listed = await listAppointments({ from: "2026-12-22", to: "2026-12-22" });
  assert.ok(listed.some((row) => row.id === appointment.id));

  await prisma.serviceAppointment.delete({ where: { id: appointment.id } });
  await prisma.consentAudit.deleteMany({ where: { guest: { email: "casey-book@example.com" } } });
  await prisma.businessCrmContact.deleteMany({ where: { guest: { email: "casey-book@example.com" } } });
  await prisma.guestProfile.deleteMany({ where: { email: "casey-book@example.com" } });
});
