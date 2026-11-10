/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { VenturePortResult } from "@/lib/dashboard/types";
import { dayDelta } from "@/lib/dates";
import { listCrmContacts } from "@/lib/experiences/crm";
import { listExperienceEvents } from "@/lib/experiences/events";
import { eventScorecard, projectExperienceCents } from "@/lib/experiences/scorecard";

export async function experiencesPort(businessDate: string): Promise<VenturePortResult> {
  const [events, scorecard, contacts] = await Promise.all([
    listExperienceEvents(),
    eventScorecard(),
    listCrmContacts(),
  ]);
  if (!scorecard) {
    return {
      confirmedCents: 0,
      potentialCents: 0,
      openCount: 0,
      hasCurrentActivity: false,
      statusLabel: "No published event",
      topItems: [],
      attention: [],
      milestones: [],
      detailHref: "/experiences",
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

  const milestones = openEvents.map((event) => ({
    id: event.id,
    venture: "pampered_events",
    title: event.title,
    dueOn: event.startsOn,
    kind: "event_date" as const,
    colorToken: "experiences",
  }));

  return {
    confirmedCents: cents.confirmedCents,
    potentialCents: cents.potentialCents,
    openCount: cents.openCount,
    hasCurrentActivity: openEvents.length > 0 || followUpQueued > 0,
    statusLabel: `${scorecard.ticketsSold} tickets · ${marketingConsents} marketing consents`,
    topItems,
    attention,
    milestones,
    detailHref: "/experiences",
  };
}
