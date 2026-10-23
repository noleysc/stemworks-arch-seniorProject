/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { createRestaurantBooking, createRoomBooking, listBookings, restaurantInputSchema, roomInputSchema } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") ?? undefined;
  if (kind && kind !== "room" && kind !== "restaurant") {
    return NextResponse.json({ error: "Unknown booking kind." }, { status: 400 });
  }
  const bookings = await listBookings(kind ? { kind } : undefined);
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a JSON booking." }, { status: 400 });
  }

  const kind = "kind" in body ? body.kind : undefined;
  if (kind === "room") {
    const parsed = roomInputSchema.safeParse(body);
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message);
    try {
      const booking = await createRoomBooking(parsed.data);
      return NextResponse.json({ id: booking.id }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      if (message?.includes("rental source")) return fieldError(message);
      throw error;
    }
  }
  if (kind === "restaurant") {
    const parsed = restaurantInputSchema.safeParse(body);
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message);
    const booking = await createRestaurantBooking(parsed.data);
    return NextResponse.json({ id: booking.id }, { status: 201 });
  }
  return NextResponse.json({ error: "Choose a room or a restaurant booking." }, { status: 400 });
}

function fieldError(message: string | undefined) {
  return NextResponse.json({ error: message ?? "Check the booking fields." }, { status: 400 });
}
