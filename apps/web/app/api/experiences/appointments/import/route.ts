/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/experiences/api-error";
import { importMassageBookCsv, massageBookTemplateCsv } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export async function GET() {
  const csv = massageBookTemplateCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="massagebook-import-template.csv"',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const csv = typeof body?.csv === "string" ? body.csv : "";
    if (!csv.trim()) {
      return NextResponse.json(
        { error: "Paste or upload a CSV before importing.", publicError: true },
        { status: 400 },
      );
    }
    const result = await importMassageBookCsv(csv);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "We couldn’t import that MassageBook export. Check the columns and try again.");
  }
}
