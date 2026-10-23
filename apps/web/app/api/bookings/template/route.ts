/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { templateCsv } from "@/lib/csv";
import { listRentalSources } from "@/lib/property";

export async function GET(request: Request) {
  const stream = new URL(request.url).searchParams.get("stream");
  if (!stream) {
    return NextResponse.json({ error: "Unknown template." }, { status: 400 });
  }
  if (stream !== "restaurant") {
    const sources = await listRentalSources();
    const source = sources.find((item) => item.key === stream);
    if (!source) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    return csvResponse(templateCsv(stream, source.importShape), stream);
  }
  return csvResponse(templateCsv(stream, "restaurant"), stream);
}

function csvResponse(body: string, stream: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stream}-bookings.csv"`,
    },
  });
}
