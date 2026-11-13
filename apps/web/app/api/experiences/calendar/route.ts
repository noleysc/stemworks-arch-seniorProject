/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { listCalendarItems, monthBounds } from "@/lib/experiences/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") ?? new Date().getUTCFullYear());
  const month = Number(url.searchParams.get("month") ?? new Date().getUTCMonth());
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid month." }, { status: 400 });
  }
  const { from, to } = monthBounds(year, month);
  const items = await listCalendarItems(from, to);
  return NextResponse.json({ year, month, from, to, items });
}
