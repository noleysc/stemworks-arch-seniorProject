/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { deleteBooking, updateBookingStatus } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const status = body && typeof body === "object" && "status" in body ? String(body.status) : "";
  try {
    await updateBookingStatus(context.params.id, status);
  } catch {
    return NextResponse.json({ error: "That booking could not be updated." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    await deleteBooking(context.params.id);
  } catch {
    return NextResponse.json({ error: "That booking is already gone." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
