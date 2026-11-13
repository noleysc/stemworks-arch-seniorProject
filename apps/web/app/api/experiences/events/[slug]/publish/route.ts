/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { getEventBySlug } from "@/lib/experiences/events";
import { publishEvent } from "@/lib/experiences/planner";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: { slug: string } }) {
  try {
    await publishEvent(context.params.slug);
    const event = await getEventBySlug(context.params.slug);
    return NextResponse.json({ event });
  } catch (error) {
    return errorResponse(error, "We couldn’t publish your invite. Please try again.");
  }
}
