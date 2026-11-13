/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { createBatch, listBatches } from "@/lib/product/batches";

export const dynamic = "force-dynamic";

export async function GET() {
  const batches = await listBatches();
  return NextResponse.json({ batches });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const batch = await createBatch(body);
    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create that batch.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
