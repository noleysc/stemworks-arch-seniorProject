/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { listExperienceEvents } from "@/lib/experiences/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await listExperienceEvents();
  return NextResponse.json({ events });
}
