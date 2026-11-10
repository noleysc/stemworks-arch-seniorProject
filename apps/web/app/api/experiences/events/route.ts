/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getEventBySlug, listExperienceEvents } from "@/lib/experiences/events";
import { createOwnerEvent, ownerEventSchema } from "@/lib/experiences/planner";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await listExperienceEvents();
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ownerEventSchema.parse(body);
    const created = await createOwnerEvent(parsed);
    const event = await getEventBySlug(created.slug);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid event." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not save the event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
