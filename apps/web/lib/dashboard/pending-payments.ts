/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { AttentionItem } from "@/lib/dashboard/types";
import { dayDelta } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

/** Payment statuses that mean nothing more is owed. */
const SETTLED_PAYMENT_STATUSES = new Set(["paid", "comped"]);

/** The only registration fields the detector reads. No guest identity is accepted or returned. */
export type PaymentRegistrationRow = {
  eventId: string;
  status: string;
  paymentStatus: string;
  amountDueCents: number;
  amountPaidCents: number;
};

export type PaymentEventRow = {
  id: string;
  title: string;
  startsOn: string;
};

export type PendingPaymentSummary = {
  eventId: string;
  eventTitle: string;
  startsOn: string;
  unpaidCount: number;
  outstandingCents: number;
};

export function isAwaitingPayment(row: PaymentRegistrationRow): boolean {
  if (row.status === "cancelled") return false;
  if (SETTLED_PAYMENT_STATUSES.has(row.paymentStatus)) return false;
  return row.amountDueCents > row.amountPaidCents;
}

/**
 * Aggregate unpaid registrations per upcoming event.
 * Past events are left to the venture detail, matching the forward-looking dashboard rule.
 */
export function summarizePendingPayments(
  events: PaymentEventRow[],
  registrations: PaymentRegistrationRow[],
  businessDate: string,
): PendingPaymentSummary[] {
  const upcoming = new Map(
    events.filter((event) => dayDelta(businessDate, event.startsOn) >= 0).map((event) => [event.id, event]),
  );
  const byEvent = new Map<string, PendingPaymentSummary>();

  for (const row of registrations) {
    const event = upcoming.get(row.eventId);
    if (!event || !isAwaitingPayment(row)) continue;
    const summary = byEvent.get(event.id) ?? {
      eventId: event.id,
      eventTitle: event.title,
      startsOn: event.startsOn,
      unpaidCount: 0,
      outstandingCents: 0,
    };
    summary.unpaidCount += 1;
    summary.outstandingCents += row.amountDueCents - row.amountPaidCents;
    byEvent.set(event.id, summary);
  }

  return Array.from(byEvent.values()).sort(
    (a, b) => a.startsOn.localeCompare(b.startsOn) || a.eventTitle.localeCompare(b.eventTitle),
  );
}

export function pendingPaymentAttention(summaries: PendingPaymentSummary[], venture: string): AttentionItem[] {
  return summaries.map((summary) => ({
    type: "pipeline_stalled",
    body: `${summary.unpaidCount} ${summary.unpaidCount === 1 ? "registration is" : "registrations are"} awaiting payment for ${summary.eventTitle} · ${formatMoney(summary.outstandingCents)} outstanding`,
    venture,
  }));
}
