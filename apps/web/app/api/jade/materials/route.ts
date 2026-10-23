/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { createMaterial, listMaterials, materialInputSchema } from "@/lib/product/materials";

export const dynamic = "force-dynamic";

export async function GET() {
  const materials = await listMaterials();
  return NextResponse.json({ materials });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = materialInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the material fields." }, { status: 400 });
  }
  const material = await createMaterial(parsed.data);
  return NextResponse.json({ id: material.id }, { status: 201 });
}
