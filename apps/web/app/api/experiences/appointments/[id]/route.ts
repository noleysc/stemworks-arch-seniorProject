/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/experiences/api-error";
import {
  cancelAppointment,
  getAppointment,
  rescheduleAppointment,
  updateAppointment,
} from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export async function GET(_request: Request, context: Context) {
  try {
    const appointment = await getAppointment(context.params.id);
    return NextResponse.json({ appointment });
  } catch (error) {
    return errorResponse(error, "We couldn’t load that appointment. Please try again.");
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await request.json();
    if (body?.action === "reschedule") {
      const appointment = await rescheduleAppointment(context.params.id, body);
      return NextResponse.json({ appointment });
    }
    if (body?.action === "cancel") {
      const appointment = await cancelAppointment(context.params.id);
      return NextResponse.json({ appointment });
    }
    const appointment = await updateAppointment(context.params.id, body);
    return NextResponse.json({ appointment });
  } catch (error) {
    return errorResponse(error, "We couldn’t update that appointment. Please try again.");
  }
}
