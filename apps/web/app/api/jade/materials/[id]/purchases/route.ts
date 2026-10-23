/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { purchaseInputSchema, receivePurchase } from "@/lib/product/materials";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = purchaseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the purchase fields." }, { status: 400 });
  }
  try {
    const purchase = await receivePurchase(context.params.id, parsed.data);
    return NextResponse.json({ id: purchase.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "That purchase could not be recorded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
