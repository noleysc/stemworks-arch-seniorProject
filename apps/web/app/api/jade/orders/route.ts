/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { createOrder, listOrders, orderInputSchema } from "@/lib/product/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the order fields." }, { status: 400 });
  }
  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json({ id: order.id, code: order.code }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "That order could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
