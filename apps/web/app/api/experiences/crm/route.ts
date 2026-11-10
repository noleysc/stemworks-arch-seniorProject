/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { listCrmContacts } from "@/lib/experiences/crm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessKey = searchParams.get("business") ?? undefined;
  const contacts = await listCrmContacts(businessKey || undefined);
  return NextResponse.json({ contacts });
}
