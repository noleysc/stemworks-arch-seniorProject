/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { rsvpInputSchema, submitRsvp } from "@/lib/experiences/rsvp";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const parsed = rsvpInputSchema.parse(body);
    const result = await submitRsvp(context.params.slug, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "We couldn’t complete your ticket request. If you were paying, check your payment status or contact the organizer before trying again.", true);
  }
}
