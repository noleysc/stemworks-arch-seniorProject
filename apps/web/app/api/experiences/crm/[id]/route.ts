/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/experiences/api-error";

import { followUpInputSchema, updateFollowUp } from "@/lib/experiences/crm";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = followUpInputSchema.parse(body);
    await updateFollowUp(context.params.id, parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "We couldn’t save the follow-up status. Please try again.");
  }
}
