/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { pendingPaymentAttention, summarizePendingPayments } from "@/lib/dashboard/pending-payments";
import type { VenturePortResult } from "@/lib/dashboard/types";
import { prisma } from "@/lib/db";
import { dayDelta } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listAppointments } from "@/lib/experiences/appointments";
import { listCrmContacts } from "@/lib/experiences/crm";
import { listExperienceEvents } from "@/lib/experiences/events";
import { eventScorecard, projectExperienceCents } from "@/lib/experiences/scorecard";

export async function experiencesPort(businessDate: string): Promise<VenturePortResult> {
  const [events, scorecard, contacts, spaAppointments] = await Promise.all([
    listExperienceEvents(),
    eventScorecard(),
    listCrmContacts(),
    listAppointments({ includeCancelled: true }),
  ]);

  const spaActive = spaAppointments.filter((row) => row.status !== "cancelled");
  const spaCollected = spaActive
    .filter((row) => row.paymentStatus !== "refunded")
    .reduce((sum, row) => sum + row.amountPaidCents, 0);
  const spaBooked = spaActive.reduce((sum, row) => sum + row.priceCents, 0);
  const spaUnpaid = spaActive.filter(
    (row) =>
      row.appointmentOn >= businessDate &&
      row.paymentStatus !== "paid" &&
      row.paymentStatus !== "refunded" &&
      row.balanceDueCents > 0,
  );
  const spaOutstanding = spaUnpaid.reduce((sum, row) => sum + row.balanceDueCents, 0);

  if (!scorecard) {
    return {
      confirmedCents: spaCollected,
      potentialCents: Math.max(spaBooked, spaCollected),
      openCount: spaActive.filter((row) => row.status === "booked" || row.status === "confirmed").length,
      hasCurrentActivity: spaActive.length > 0,
      statusLabel: "Spa & experiences desk",
      topItems: spaActive.slice(0, 3).map((row) => ({
        label: row.serviceTitle,
        stage: row.paymentStatus,
        valueCents: row.amountPaidCents || row.priceCents,
        kind: "spa_appointment",
      })),
      attention:
        spaUnpaid.length > 0
          ? [
              {
                type: "pipeline_stalled" as const,
                body: `${spaUnpaid.length} spa ${spaUnpaid.length === 1 ? "appointment is" : "appointments are"} awaiting payment · ${formatMoney(spaOutstanding)} outstanding`,
                venture: "pampered_events",
              },
            ]
          : [],
      milestones: [],
      detailHref: "/thepamperedsoul/bookings",
    };
  }
  const cents = projectExperienceCents(scorecard);
  const openEvents = events.filter((event) => event.status === "open" || event.status === "full");
  const followUpQueued = contacts.filter((contact) => contact.followUpStatus === "queued").length;
  const marketingConsents = scorecard.optInsByVendor.reduce((sum, row) => sum + row.optIns, 0);

  const topItems = openEvents.slice(0, 3).map((event) => ({
    label: event.title,
    stage: `${event.ticketCount}/${event.capacity} tickets`,
    valueCents: scorecard.ticketRevenueCents,
    kind: "experience_event",
  }));

  const attention: VenturePortResult["attention"] = [];
  for (const event of openEvents) {
    const delta = dayDelta(businessDate, event.startsOn);
    if (delta >= 0 && delta <= 3) {
      attention.push({
        type: "event_milestone_due",
        body:
          delta === 0
            ? `${event.title} is today · ${event.ticketCount} tickets sold`
            : `${event.title} is in ${delta} days · ${event.ticketCount} tickets sold`,
        venture: "pampered_events",
      });
    }
  }
  if (followUpQueued > 0 && dayDelta(businessDate, scorecard.startsOn) < 0) {
    attention.push({
      type: "pipeline_stalled",
      body: `${followUpQueued} marketing-consent follow-ups are queued after the event`,
      venture: "pampered_events",
    });
  }

  // Read-only: select payment fields only, never guest identity, so the dashboard API stays aggregate.
  const payableEvents = events.filter((event) => event.status !== "cancelled");
  const paymentRows = payableEvents.length
    ? await prisma.eventRegistration.findMany({
        where: { eventId: { in: payableEvents.map((event) => event.id) }, status: { not: "cancelled" } },
        select: { eventId: true, status: true, paymentStatus: true, amountDueCents: true, amountPaidCents: true },
      })
    : [];
  attention.push(
    ...pendingPaymentAttention(summarizePendingPayments(payableEvents, paymentRows, businessDate), "pampered_events"),
  );
  if (spaUnpaid.length > 0) {
    attention.push({
      type: "pipeline_stalled",
      body: `${spaUnpaid.length} spa ${spaUnpaid.length === 1 ? "appointment is" : "appointments are"} awaiting payment · ${formatMoney(spaOutstanding)} outstanding`,
      venture: "pampered_events",
    });
  }

  const milestones = openEvents.map((event) => ({
    id: event.id,
    venture: "pampered_events",
    title: event.title,
    dueOn: event.startsOn,
    kind: "event_date" as const,
    colorToken: "experiences",
  }));

  return {
    confirmedCents: cents.confirmedCents + spaCollected,
    potentialCents: Math.max(cents.potentialCents + spaBooked, cents.confirmedCents + spaCollected),
    openCount: cents.openCount + spaActive.filter((row) => row.status === "booked" || row.status === "confirmed").length,
    hasCurrentActivity: openEvents.length > 0 || followUpQueued > 0 || spaActive.length > 0,
    statusLabel: `${scorecard.ticketsSold} tickets · ${spaActive.length} spa · ${marketingConsents} consents`,
    topItems,
    attention,
    milestones,
    detailHref: "/thepamperedsoul",
  };
}
