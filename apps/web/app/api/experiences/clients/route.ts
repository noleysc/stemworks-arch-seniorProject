/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/experiences/api-error";
import { listSpaClients, updateSpaClient } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const clients = await listSpaClients(q);
    return NextResponse.json({ clients });
  } catch (error) {
    return errorResponse(error, "We couldn’t load spa clients. Please try again.");
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const client = await updateSpaClient(body);
    return NextResponse.json({ client });
  } catch (error) {
    return errorResponse(error, "We couldn’t save those client details. Please try again.");
  }
}
