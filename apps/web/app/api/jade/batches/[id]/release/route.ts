/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { releaseBatch } from "@/lib/product/batches";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const batch = await releaseBatch(context.params.id, body);
    return NextResponse.json({ batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not release that batch.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
