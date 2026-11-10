/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createItineraryItem, itineraryInputSchema, listItinerary } from "@/lib/experiences/itinerary";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { slug: string } }) {
  try {
    const items = await listItinerary(context.params.slug);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load itinerary.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(request: Request, context: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const parsed = itineraryInputSchema.parse({ ...body, eventSlug: context.params.slug });
    const item = await createItineraryItem(parsed);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid itinerary item." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not add that treatment.";
    const status = message === "Event not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
