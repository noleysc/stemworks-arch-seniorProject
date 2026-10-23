/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { listTenants } from "@/lib/dashboard/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ tenants: listTenants() });
}
