/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { getEventBySlug } from "@/lib/experiences/events";
import { updateOwnerEvent } from "@/lib/experiences/planner";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { slug: string } }) {
  const event = await getEventBySlug(context.params.slug);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(request: Request, context: { params: { slug: string } }) {
  try {
    const body = await request.json();
    await updateOwnerEvent(context.params.slug, body);
    const event = await getEventBySlug(context.params.slug);
    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update invite.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
