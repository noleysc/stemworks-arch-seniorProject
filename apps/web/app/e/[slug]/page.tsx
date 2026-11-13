/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { notFound } from "next/navigation";

import { GuestInviteView } from "@/components/experiences/guest-invite-view";
import { getEventBySlug, listGuestWall } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

/** Guest-facing invite. No planner chrome, no CRM, no edit controls. */
export default async function PublicEventPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event || (event.status !== "open" && event.status !== "full")) notFound();
  const wall = await listGuestWall(event.id);

  return <GuestInviteView event={event} wall={wall} />;
}
