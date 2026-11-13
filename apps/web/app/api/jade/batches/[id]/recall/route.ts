/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { recallBatch } from "@/lib/product/batches";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const result = await recallBatch(context.params.id, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not recall that batch.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
