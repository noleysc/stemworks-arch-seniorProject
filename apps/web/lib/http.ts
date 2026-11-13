/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/** A message deliberately returned for display, rather than an arbitrary exception. */
export class RequestError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "RequestError";
  }
}

export async function requestJson<T = void>(url: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.publicError === true && typeof body.error === "string" && body.error.trim()
      ? body.error : fallback;
    throw new RequestError(message, response.status);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError(fallback);
  return body as T;
}

export function requestErrorMessage(error: unknown, fallback: string, paymentInProgress = false): string {
  if (error instanceof RequestError) return error.message;
  if (error instanceof TypeError) return paymentInProgress
    ? "We lost the connection during checkout. Check your payment status or contact the organizer before trying again."
    : "We couldn’t connect. Check your connection and try again.";
  return fallback;
}
