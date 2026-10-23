/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { loadRentalAggregate } from "@/lib/rentals";

export const dynamic = "force-dynamic";

export async function GET() {
  const aggregate = await loadRentalAggregate();
  return NextResponse.json(aggregate);
}
