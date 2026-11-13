/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { deleteItineraryItem } from "@/lib/experiences/itinerary";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: { slug: string; id: string } }) {
  try {
    await deleteItineraryItem(context.params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "We couldn’t remove that itinerary item. Please try again.");
  }
}
