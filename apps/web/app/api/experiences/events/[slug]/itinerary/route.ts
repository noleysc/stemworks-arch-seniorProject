/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { createItineraryItem, itineraryInputSchema, listItinerary } from "@/lib/experiences/itinerary";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { slug: string } }) {
  try {
    const items = await listItinerary(context.params.slug);
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error, "We couldn’t load the itinerary. Please try again.");
  }
}

export async function POST(request: Request, context: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const parsed = itineraryInputSchema.parse({ ...body, eventSlug: context.params.slug });
    const item = await createItineraryItem(parsed);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "We couldn’t add that itinerary item. Please try again.");
  }
}
