/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { bookServiceAppointment, listAppointments } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const appointments = await listAppointments({ from, to });
    return NextResponse.json({ appointments });
  } catch (error) {
    return errorResponse(error, "We couldn’t load your appointments. Please try again.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointment = await bookServiceAppointment(body);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "We couldn’t confirm your appointment. Check your bookings or contact the spa before trying again.");
  }
}
