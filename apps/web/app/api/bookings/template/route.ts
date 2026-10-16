/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { templateCsv, type ImportStream } from "@/lib/csv";

const streams = new Set<ImportStream>(["luminary_website", "airbnb", "restaurant"]);

export async function GET(request: Request) {
  const stream = new URL(request.url).searchParams.get("stream") as ImportStream | null;
  if (!stream || !streams.has(stream)) {
    return NextResponse.json({ error: "Unknown template." }, { status: 400 });
  }
  return new NextResponse(templateCsv(stream), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stream}-bookings.csv"`,
    },
  });
}
