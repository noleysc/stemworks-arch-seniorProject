/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { z } from "zod";

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
    const message = error instanceof Error ? error.message : "Revoke failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
