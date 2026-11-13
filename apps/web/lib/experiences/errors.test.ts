import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { PublicError, publicFailure, validationMessage } from "./errors";
import { cardPaymentSchema } from "./payments";
import { bookAppointmentSchema } from "./appointments";
import { errorResponse } from "./api-error";

test("only deliberately public business errors retain their messages and statuses", () => {
  assert.deepEqual(publicFailure(new PublicError("This invite was cancelled.", 409), "Fallback"), { message: "This invite was cancelled.", status: 409 });
  assert.deepEqual(publicFailure(new Error("Invalid prisma.experienceEvent.create() SELECT secret"), "We couldn’t save your invite."), { message: "We couldn’t save your invite.", status: 500 });
});

test("uniqueness errors are classified by model and constraint, not all called duplicate names", () => {
  assert.match(publicFailure({ code: "P2002", meta: { modelName: "TicketTier", target: ["eventId", "key"] } }, "Fallback").message, /Ticket types must have different names/);
  for (const meta of [
    { modelName: "EventRegistration", target: ["confirmationCode"] },
    { modelName: "GuestProfile", target: ["email"] },
    { modelName: "OtherModel", target: ["eventId", "key"] },
  ]) assert.deepEqual(publicFailure({ code: "P2002", meta }, "Fallback"), { message: "Fallback", status: 500 });
});

test("validation errors name fields rather than returning schema internals", () => {
  const card = { cardholderName: "Test Guest", cardNumber: "4242424242424242", expMonth: 12, expYear: 2030, cvc: "123" };
  for (const [field, value, expected] of [
    ["cardNumber", "123", "Enter a valid card number."],
    ["expMonth", 13, "Enter a valid expiry month, from 1 to 12."],
    ["expYear", "bad", "Enter a valid four-digit expiry year."],
    ["cvc", "a", "Enter the 3- or 4-digit security code on your card."],
  ] as const) {
    const parsed = cardPaymentSchema.safeParse({ ...card, [field]: value });
    assert.equal(parsed.success, false);
    if (!parsed.success) assert.equal(validationMessage(parsed.error), expected);
  }
  const appointment = bookAppointmentSchema.safeParse({ serviceKey: "swedish-50", appointmentOn: "2026-12-18", startsAtLabel: "5:00 PM", clientName: "Test Guest", clientEmail: "bad", clientPhone: "239-555-0100" });
  if (!appointment.success) assert.equal(validationMessage(appointment.error), "Enter a valid email address.");
  const longNote = z.object({ guestNote: z.string().max(120) }).safeParse({ guestNote: "x".repeat(121) });
  if (!longNote.success) assert.equal(validationMessage(longNote.error), "Keep the guest-wall note to 120 characters or fewer.");
  const custom = z.any().refine(() => false, "Unexpected technical diagnostics").safeParse({});
  if (!custom.success) assert.equal(validationMessage(custom.error), "Check the form details and try again.");
});

test("provider errors are translated without leaking request details or API keys", () => {
  for (const [code, text] of [["expired_card", "Your card has expired. Use another card."], ["invalid_number", "Enter a valid card number."], ["card_declined", "Your card was declined. Try another card or contact your bank."]]) {
    assert.equal(publicFailure({ type: "StripeCardError", code, message: "raw stripe error containing card data" }, "Fallback").message, text);
  }
  assert.equal(publicFailure({ type: "StripeAuthenticationError", message: "API key sk_secret" }, "Payments are unavailable.").message, "Payments are unavailable.");
});

test("late checkout storage failures remain cautious and logs omit raw data", async (context) => {
  const log = context.mock.method(console, "error", () => {});
  const fallback = "Check your payment status before trying again.";
  for (const [code, status] of [["P2021", 503], ["P2025", 404]] as const) {
    const response = errorResponse(Object.assign(new Error("SQL guest@example.com card 4242424242424242"), { code }), fallback, true);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { publicError: true, error: fallback });
  }
  assert.equal(log.mock.calls.length, 2);
  assert.doesNotMatch(JSON.stringify(log.mock.calls.map(call => call.arguments)), /guest@example|424242|SQL/);
});
