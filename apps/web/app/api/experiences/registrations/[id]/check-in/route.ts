/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { checkInRegistration } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    await checkInRegistration(context.params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
