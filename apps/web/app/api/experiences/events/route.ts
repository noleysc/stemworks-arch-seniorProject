/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { getEventBySlug, listExperienceEvents } from "@/lib/experiences/events";
import { createOwnerEvent, ownerEventSchema } from "@/lib/experiences/planner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await listExperienceEvents();
    return NextResponse.json({ events });
  } catch (error) {
    return errorResponse(error, "We couldn’t load your invites. Please try again.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ownerEventSchema.parse(body);
    const created = await createOwnerEvent(parsed);
    const event = await getEventBySlug(created.slug);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "We couldn’t save your invite. Please try again.");
  }
}
