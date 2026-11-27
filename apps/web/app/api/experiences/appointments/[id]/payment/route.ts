/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/experiences/api-error";
import {
  collectAppointmentPayment,
  markAppointmentRefunded,
} from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export async function POST(request: Request, context: Context) {
  try {
    const body = await request.json();
    if (body?.action === "refund") {
      const appointment = await markAppointmentRefunded(context.params.id);
      return NextResponse.json({ appointment });
    }
    const appointment = await collectAppointmentPayment(context.params.id, body);
    return NextResponse.json({ appointment });
  } catch (error) {
    return errorResponse(error, "We couldn’t record that payment. Check the amount and try again.");
  }
}
