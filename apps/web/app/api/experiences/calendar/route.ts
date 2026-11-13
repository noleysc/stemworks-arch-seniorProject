/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";
import { PublicError } from "@/lib/experiences/errors";

import { listCalendarItems, monthBounds } from "@/lib/experiences/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") ?? new Date().getUTCFullYear());
    const month = Number(url.searchParams.get("month") ?? new Date().getUTCMonth());
    if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1 || year > 9999 || month < 0 || month > 11) {
      throw new PublicError("Choose a valid calendar month and year.");
    }
    const { from, to } = monthBounds(year, month);
    const items = await listCalendarItems(from, to);
    return NextResponse.json({ year, month, from, to, items });
  } catch (error) {
    return errorResponse(error, "We couldn’t load the calendar. Please try again.");
  }
}
