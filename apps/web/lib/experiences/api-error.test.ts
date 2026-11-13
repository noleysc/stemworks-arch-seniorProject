import assert from "node:assert/strict";
import test from "node:test";

import { GET as listEvents } from "@/app/api/experiences/events/route";
import { POST as purchase } from "@/app/api/experiences/events/[slug]/rsvp/route";
import { POST as appointment } from "@/app/api/experiences/appointments/route";
import { GET as calendar } from "@/app/api/experiences/calendar/route";
import { POST as checkIn } from "@/app/api/experiences/registrations/[id]/check-in/route";
import { POST as unpublish } from "@/app/api/experiences/events/[slug]/unpublish/route";
import { POST as cancel } from "@/app/api/experiences/events/[slug]/cancel/route";
import { prisma } from "@/lib/db";

function request(body: unknown) {
  return new Request("http://localhost/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

test("checkout API gives field-specific card validation before purchase", async () => {
  const response = await purchase(request({
    fullName: "Test Guest", email: "test@example.com", phone: "239-555-0100", tierKey: "general",
    payment: { cardholderName: "Test Guest", cardNumber: "123", expMonth: 12, expYear: 2030, cvc: "123" },
  }), { params: { slug: "not-used-validation-fails-first" } });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { publicError: true, error: "Enter a valid card number." });
});

test("appointment and calendar APIs return readable input errors", async () => {
  const invalidAppointment = await appointment(request({ serviceKey: "swedish-50", appointmentOn: "2026-12-18", startsAtLabel: "5:00 PM", clientName: "Guest", clientEmail: "bad", clientPhone: "239-555-0100" }));
  assert.deepEqual(await invalidAppointment.json(), { publicError: true, error: "Enter a valid email address." });
  const missingService = await appointment(request({ serviceKey: "missing-service", appointmentOn: "2026-12-18", startsAtLabel: "5:00 PM", clientName: "Guest", clientEmail: "guest@example.com", clientPhone: "239-555-0100" }));
  assert.deepEqual(await missingService.json(), { publicError: true, error: "That treatment is no longer available. Refresh the spa menu and choose another treatment." });
  for (const query of ["year=bad&month=0", "year=2026&month=12", "year=2026&month=1.5"]) {
    const response = await calendar(new Request(`http://localhost/calendar?${query}`));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { publicError: true, error: "Choose a valid calendar month and year." });
  }
});

test("unexpected query failures produce a safe response and server-only diagnostic codes", async (context) => {
  const log = context.mock.method(console, "error", () => {});
  const originalQuery = prisma.experienceEvent.findMany;
  prisma.experienceEvent.findMany = () => { throw Object.assign(new Error("SELECT GuestProfile secret"), { code: "P9999" }); };
  try {
    const response = await listEvents();
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { publicError: true, error: "We couldn’t load your invites. Please try again." });
    assert.equal(log.mock.calls.length, 1);
    assert.equal((log.mock.calls[0].arguments[1] as { code: string }).code, "P9999");
    assert.doesNotMatch(JSON.stringify(log.mock.calls[0].arguments), /GuestProfile|secret/);
  } finally {
    prisma.experienceEvent.findMany = originalQuery;
  }
});

test("missing guest and lifecycle targets return useful instructions without diagnostics", async () => {
  const response = await checkIn(request({}), { params: { id: "missing-api-error-test-registration" } });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { publicError: true, error: "That guest registration could not be found. Refresh the guest list and try again." });
  for (const action of [unpublish, cancel]) {
    const missing = await action(request({}), { params: { slug: "missing-api-error-test-invite" } });
    assert.equal(missing.status, 404);
    assert.match((await missing.json()).error, /Refresh the invite list/);
  }
});
