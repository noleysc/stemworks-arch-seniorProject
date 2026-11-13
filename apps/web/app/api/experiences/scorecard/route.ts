/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { eventScorecard } from "@/lib/experiences/scorecard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") ?? undefined;
    const scorecard = await eventScorecard(slug);
    return NextResponse.json({ scorecard });
  } catch (error) {
    return errorResponse(error, "We couldn’t load the event scorecard. Please try again.");
  }
}
