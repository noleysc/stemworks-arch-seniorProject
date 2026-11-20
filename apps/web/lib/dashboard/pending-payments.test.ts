import assert from "node:assert/strict";
import test from "node:test";

import {
  isAwaitingPayment,
  pendingPaymentAttention,
  summarizePendingPayments,
  type PaymentRegistrationRow,
} from "./pending-payments";

const today = "2026-11-20";

function reg(overrides: Partial<PaymentRegistrationRow> = {}): PaymentRegistrationRow {
  return {
    eventId: "spa",
    status: "registered",
    paymentStatus: "unpaid",
    amountDueCents: 5_000,
    amountPaidCents: 0,
    ...overrides,
  };
}

test("only open, unsettled registrations with money owed count as awaiting payment", () => {
  assert.equal(isAwaitingPayment(reg()), true);
  assert.equal(isAwaitingPayment(reg({ paymentStatus: "paid", amountPaidCents: 5_000 })), false);
  assert.equal(isAwaitingPayment(reg({ paymentStatus: "comped", amountDueCents: 0 })), false);
  assert.equal(isAwaitingPayment(reg({ status: "cancelled" })), false);
  // Rows created with schema defaults (amountDueCents 0) are not follow-ups.
  assert.equal(isAwaitingPayment(reg({ amountDueCents: 0 })), false);
  assert.equal(isAwaitingPayment(reg({ amountPaidCents: 2_000 })), true);
  // A "paid" label wins even if amounts disagree, so settled guests are never chased.
  assert.equal(isAwaitingPayment(reg({ paymentStatus: "paid" })), false);
});

test("summaries aggregate per upcoming event, skip past events, and sort by date", () => {
  const events = [
    { id: "spa", title: "Spa Night", startsOn: "2026-12-05" },
    { id: "brunch", title: "Wellness Brunch", startsOn: "2026-11-20" },
    { id: "past", title: "Autumn Retreat", startsOn: "2026-11-01" },
  ];
  const summaries = summarizePendingPayments(
    events,
    [
      reg(),
      reg({ amountDueCents: 8_000, amountPaidCents: 3_000 }),
      reg({ paymentStatus: "paid", amountPaidCents: 5_000 }),
      reg({ eventId: "brunch", amountDueCents: 2_500 }),
      reg({ eventId: "past" }),
      reg({ eventId: "unknown" }),
    ],
    today,
  );

  assert.deepEqual(summaries, [
    { eventId: "brunch", eventTitle: "Wellness Brunch", startsOn: "2026-11-20", unpaidCount: 1, outstandingCents: 2_500 },
    { eventId: "spa", eventTitle: "Spa Night", startsOn: "2026-12-05", unpaidCount: 2, outstandingCents: 10_000 },
  ]);
});

test("no unpaid registrations yields no attention items", () => {
  const events = [{ id: "spa", title: "Spa Night", startsOn: "2026-12-05" }];
  assert.deepEqual(summarizePendingPayments(events, [], today), []);
  assert.deepEqual(pendingPaymentAttention([], "pampered_events"), []);
});

test("attention lines carry only counts and amounts", () => {
  const items = pendingPaymentAttention(
    [
      { eventId: "spa", eventTitle: "Spa Night", startsOn: "2026-12-05", unpaidCount: 2, outstandingCents: 10_000 },
      { eventId: "brunch", eventTitle: "Wellness Brunch", startsOn: "2026-12-06", unpaidCount: 1, outstandingCents: 2_500 },
    ],
    "pampered_events",
  );
  assert.deepEqual(items, [
    {
      type: "pipeline_stalled",
      body: "2 registrations are awaiting payment for Spa Night · $100.00 outstanding",
      venture: "pampered_events",
    },
    {
      type: "pipeline_stalled",
      body: "1 registration is awaiting payment for Wellness Brunch · $25.00 outstanding",
      venture: "pampered_events",
    },
  ]);
  assert.deepEqual(Object.keys(items[0]).sort(), ["body", "type", "venture"]);
});
