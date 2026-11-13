/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { bookServiceAppointment, listAppointments } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const appointments = await listAppointments({ from, to });
  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointment = await bookServiceAppointment(body);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not book that service.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
