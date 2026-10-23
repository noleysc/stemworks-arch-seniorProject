/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { createSku, listSkus, skuInputSchema } from "@/lib/product/skus";

export const dynamic = "force-dynamic";

export async function GET() {
  const skus = await listSkus();
  return NextResponse.json({ skus });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = skuInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the SKU fields." }, { status: 400 });
  }
  try {
    const sku = await createSku(parsed.data);
    return NextResponse.json({ id: sku.id, code: sku.code }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "That SKU could not be saved.";
    return NextResponse.json({ error: message }, { status: message.includes("already") ? 409 : 400 });
  }
}
