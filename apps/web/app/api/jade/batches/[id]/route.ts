/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { getBatch, recallPackageForBatch } from "@/lib/product/batches";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const batch = await getBatch(context.params.id);
  if (!batch) return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  const recall = await recallPackageForBatch(context.params.id);
  return NextResponse.json({ batch, recall });
}
