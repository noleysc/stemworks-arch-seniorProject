/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/experiences/api-error";
import { spaAppointmentReport } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const report = await spaAppointmentReport({ from, to });
    return NextResponse.json({ report });
  } catch (error) {
    return errorResponse(error, "We couldn’t load the spa appointment report. Please try again.");
  }
}
