/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { updateOrderStatus } from "@/lib/product/orders";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const status = body && typeof body === "object" && "status" in body ? String(body.status) : "";
  try {
    await updateOrderStatus(context.params.id, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "That order could not be updated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
