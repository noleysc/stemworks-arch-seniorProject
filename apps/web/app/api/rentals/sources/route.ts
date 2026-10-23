/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { listRentalSources, registerRentalSource } from "@/lib/property";

export const dynamic = "force-dynamic";

export async function GET() {
  const sources = await listRentalSources();
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a rental source." }, { status: 400 });
  }
  const key = "key" in body ? String(body.key) : "";
  const label = "label" in body ? String(body.label) : "";
  const importShape = "importShape" in body ? String(body.importShape) : "";
  try {
    const source = await registerRentalSource({ key, label, importShape });
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "That source could not be added.";
    const status = message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
