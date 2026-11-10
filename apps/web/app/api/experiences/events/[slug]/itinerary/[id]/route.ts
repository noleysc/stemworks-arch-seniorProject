/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { deleteItineraryItem } from "@/lib/experiences/itinerary";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: { slug: string; id: string } }) {
  try {
    await deleteItineraryItem(context.params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove that item.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
