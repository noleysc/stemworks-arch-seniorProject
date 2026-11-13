/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ZodError } from "zod";

export class PublicError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "PublicError";
  }
}

const customMessages = new Set([
  "Ticket types must have different names. Rename the duplicate ticket type.",
  "Pick a spa service or type a custom itinerary title.",
]);

export function validationMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Check the form details and try again.";
  if (issue.code === "custom") return customMessages.has(issue.message) ? issue.message : "Check the form details and try again.";
  const field = String(issue.path.at(-1) ?? "");
  const messages: Record<string, string> = {
    email: "Enter a valid email address.", clientEmail: "Enter a valid email address.", guestEmail: "Enter a valid guest email address.",
    phone: "Enter a valid phone number.", clientPhone: "Enter a valid phone number.",
    cardholderName: "Enter the name shown on your card (2–120 characters).",
    cardNumber: "Enter a valid card number.",
    expMonth: "Enter a valid expiry month, from 1 to 12.", expYear: "Enter a valid four-digit expiry year.",
    cvc: "Enter the 3- or 4-digit security code on your card.",
    startsOn: "Choose a valid event date.", appointmentOn: "Choose a valid appointment date.",
    tierKey: "Choose an available ticket type.", ticketQuantity: "Choose between 1 and 8 tickets.",
    serviceKey: "Choose an available spa service.", followUpStatus: "Choose a valid follow-up status.",
    businessKey: "Choose a participating business.", payment: "Enter payment details for this paid ticket.",
  };
  if (messages[field]) return messages[field];
  const labels: Record<string, string> = {
    title: "title", summary: "event description", location: "location", startsAtLabel: "time",
    capacity: "event capacity", hostDisplayName: "host name", label: "ticket name", description: "ticket description",
    price: "ticket price", quantityAvailable: "ticket quantity", displayName: "business name", roleLabel: "business role",
    fullName: "name", clientName: "name", guestNote: "guest-wall note", notes: "note", lastInteraction: "follow-up note",
    detail: "itinerary description", placeLabel: "itinerary location", emoji: "itinerary symbol",
  };
  const label = labels[field];
  if (label && issue.code === "too_big") {
    return issue.origin === "string" ? `Keep the ${label} to ${issue.maximum} characters or fewer.` : `The ${label} must be ${issue.maximum} or less.`;
  }
  if (label && issue.code === "too_small" && issue.origin === "number") return `The ${label} must be at least ${issue.minimum}.`;
  if (field === "tiers") return "Add at least one ticket type.";
  return label ? `Enter a valid ${label} and try again.` : "Check the form details and try again.";
}

export function publicFailure(error: unknown, fallback: string): { message: string; status: number } {
  if (error instanceof PublicError) return { message: error.message, status: error.status };
  if (error instanceof ZodError) return { message: validationMessage(error), status: 400 };
  if (error instanceof SyntaxError) return { message: "We couldn’t read those details. Refresh the page and try again.", status: 400 };
  if (error && typeof error === "object") {
    const failure = error as { code?: string; type?: string; meta?: { modelName?: string; target?: unknown } };
    if (failure.code === "P2002" && failure.meta?.modelName === "TicketTier" && Array.isArray(failure.meta.target)
      && failure.meta.target.length === 2 && failure.meta.target.includes("eventId") && failure.meta.target.includes("key")) {
      return { message: "Ticket types must have different names. Rename the duplicate ticket type.", status: 409 };
    }
    if (failure.code === "P2025") return { message: "That item is no longer available. Refresh the page and try again.", status: 404 };
    if (["P2021", "P1001", "P1002"].includes(failure.code ?? "")) {
      return { message: "This feature is temporarily unavailable. Please try again later.", status: 503 };
    }
    if (failure.type === "StripeCardError") {
      const messages: Record<string, string> = {
        incorrect_number: "Enter a valid card number.", invalid_number: "Enter a valid card number.",
        expired_card: "Your card has expired. Use another card.",
        incorrect_cvc: "The card security code is incorrect. Check it and try again.",
        invalid_cvc: "Enter the 3- or 4-digit security code on your card.",
        invalid_expiry_month: "Enter a valid expiry month, from 1 to 12.", invalid_expiry_year: "Enter a valid four-digit expiry year.",
        card_declined: "Your card was declined. Try another card or contact your bank.",
      };
      return { message: messages[failure.code ?? ""] ?? "Your card could not be accepted. Check your card details or try another card.", status: 400 };
    }
  }
  return { message: fallback, status: 500 };
}
