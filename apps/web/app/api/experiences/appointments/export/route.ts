/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/experiences/api-error";
import { appointmentsToCsv, listAppointments } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const appointments = await listAppointments({
      from,
      to,
      includeCancelled: url.searchParams.get("includeCancelled") === "1",
    });
    const csv = appointmentsToCsv(appointments);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="spa-appointments.csv"',
      },
    });
  } catch (error) {
    return errorResponse(error, "We couldn’t export appointments. Please try again.");
  }
}
