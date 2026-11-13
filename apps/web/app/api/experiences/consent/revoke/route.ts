/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/experiences/api-error";

import { revokeVendorConsent } from "@/lib/experiences/rsvp";

export const dynamic = "force-dynamic";

const schema = z.object({
  guestEmail: z.string().trim().email(),
  businessKey: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await revokeVendorConsent(body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "We couldn’t update those marketing preferences. Please try again.");
  }
}
