/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { checkInRegistration } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    await checkInRegistration(context.params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "We couldn’t check in this guest. Please try again.");
  }
}
