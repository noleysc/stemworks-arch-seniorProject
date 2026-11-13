/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";
import { PublicError } from "@/lib/experiences/errors";

import { vendorGuestView } from "@/lib/experiences/crm";
import { getEventBySlug } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const businessKey = searchParams.get("business");
    if (!businessKey) {
      throw new PublicError("Choose a participating business to view its guest list.");
    }
    const event = await getEventBySlug(context.params.slug);
    if (!event) throw new PublicError("That invite could not be found. Check the link and try again.", 404);
    const guests = await vendorGuestView(event.id, businessKey);
    return NextResponse.json({ event: { id: event.id, title: event.title, slug: event.slug }, guests });
  } catch (error) {
    return errorResponse(error, "We couldn’t load that business’s guest list. Please try again.");
  }
}
