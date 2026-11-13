/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { publicFailure } from "@/lib/experiences/errors";

export function errorResponse(error: unknown, fallback: string, paymentMayHaveCompleted = false) {
  const failure = publicFailure(error, fallback);
  const diagnostic = error as { name?: unknown; code?: unknown; type?: unknown } | null;
  const databaseFailure = typeof diagnostic?.code === "string" && /^P\d{4}$/.test(diagnostic.code);
  // A late checkout failure does not prove the payment failed. Never invite a blind retry.
  const uncertainPayment = paymentMayHaveCompleted && (failure.status >= 500 || databaseFailure);
  const message = uncertainPayment ? fallback : failure.message;
  if (failure.status >= 500 || uncertainPayment) {
    // Never log raw exception messages, request bodies, guest contacts, or card details.
    console.error("[Pampered Soul]", {
      operation: fallback,
      name: typeof diagnostic?.name === "string" ? diagnostic.name : undefined,
      code: typeof diagnostic?.code === "string" ? diagnostic.code : undefined,
      type: typeof diagnostic?.type === "string" ? diagnostic.type : undefined,
    });
  }
  return NextResponse.json({ error: message, publicError: true }, { status: failure.status });
}
