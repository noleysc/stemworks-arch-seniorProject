/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";
import { PublicError } from "@/lib/experiences/errors";

import { getEventBySlug } from "@/lib/experiences/events";
import { updateOwnerEvent } from "@/lib/experiences/planner";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { slug: string } }) {
  try {
    const event = await getEventBySlug(context.params.slug);
    if (!event) throw new PublicError("That invite could not be found. Check the link and try again.", 404);
    return NextResponse.json({ event });
  } catch (error) {
    return errorResponse(error, "We couldn’t load that invite. Please try again.");
  }
}

export async function PATCH(request: Request, context: { params: { slug: string } }) {
  try {
    const body = await request.json();
    await updateOwnerEvent(context.params.slug, body);
    const event = await getEventBySlug(context.params.slug);
    return NextResponse.json({ event });
  } catch (error) {
    return errorResponse(error, "We couldn’t save your invite changes. Please try again.");
  }
}
