/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { composeDashboard } from "@/lib/dashboard/composer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenant = url.searchParams.get("tenant") ?? "luminary";
  const venture = url.searchParams.get("venture") ?? undefined;
  const horizon = url.searchParams.get("horizon");
  const horizonDays = horizon === "12m" ? 365 : 90;

  const result = await composeDashboard({ tenantKey: tenant, venture, horizonDays });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
