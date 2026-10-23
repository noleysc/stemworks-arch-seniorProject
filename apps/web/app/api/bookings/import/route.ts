/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { importBookings } from "@/lib/bookings";
import { listRentalSources } from "@/lib/property";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("stream" in body) || !("csv" in body)) {
    return NextResponse.json({ error: "Send a stream and a csv field." }, { status: 400 });
  }
  const stream = String(body.stream);
  const csv = String(body.csv ?? "");
  if (stream !== "restaurant") {
    const sources = await listRentalSources();
    if (!sources.some((source) => source.key === stream)) {
      return NextResponse.json({ error: "That rental source is not registered for this property." }, { status: 400 });
    }
  }
  if (csv.length > 1_500_000) {
    return NextResponse.json({ error: "That file is larger than this desk accepts." }, { status: 413 });
  }
  const result = await importBookings(stream, csv);
  return NextResponse.json(result);
}
