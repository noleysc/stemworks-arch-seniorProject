/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { rsvpInputSchema, submitRsvp } from "@/lib/experiences/rsvp";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const parsed = rsvpInputSchema.parse(body);
    const result = await submitRsvp(context.params.slug, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid ticket order." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not register.";
    const status =
      message.includes("already have tickets") || message.includes("capacity") || message.includes("enough")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
