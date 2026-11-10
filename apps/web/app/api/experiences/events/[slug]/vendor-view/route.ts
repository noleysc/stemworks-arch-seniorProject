/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { vendorGuestView } from "@/lib/experiences/crm";
import { getEventBySlug } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const businessKey = searchParams.get("business");
    if (!businessKey) {
      return NextResponse.json({ error: "business query is required." }, { status: 400 });
    }
    const event = await getEventBySlug(context.params.slug);
    if (!event) return NextResponse.json({ error: "Unknown event." }, { status: 404 });
    const guests = await vendorGuestView(event.id, businessKey);
    return NextResponse.json({ event: { id: event.id, title: event.title, slug: event.slug }, guests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vendor view failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
