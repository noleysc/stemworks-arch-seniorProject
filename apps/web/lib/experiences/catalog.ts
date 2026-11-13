/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

export const EVENT_STATUSES = [
  { key: "draft", label: "Draft" },
  { key: "open", label: "Open" },
  { key: "full", label: "Full" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export const REGISTRATION_STATUSES = [
  { key: "registered", label: "Registered" },
  { key: "confirmed", label: "Ticketed" },
  { key: "attended", label: "Checked in" },
  { key: "no_show", label: "No show" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export const FOLLOW_UP_STATUSES = [
  { key: "none", label: "None" },
  { key: "queued", label: "Queued" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
] as const;

export const DEFAULT_HOST_NAME = "The Pampered Soul";

export const DEFAULT_EVENT_LOCATION = "16313 S Tamiami Trail, Fort Myers, FL 33908";

export const DEFAULT_DISCLOSURE =
  "Buying a ticket shares your details with The Pampered Soul for this event. Checking a box below grants that business marketing consent (email and SMS). Leave boxes unchecked if you only want event updates. A ticket is not marketing consent — one ticket does not consent for every vendor.";

export function eventStatusLabel(status: string) {
  return EVENT_STATUSES.find((item) => item.key === status)?.label ?? status;
}

export function registrationStatusLabel(status: string) {
  return REGISTRATION_STATUSES.find((item) => item.key === status)?.label ?? status;
}

export function followUpStatusLabel(status: string) {
  return FOLLOW_UP_STATUSES.find((item) => item.key === status)?.label ?? status;
}

export function formatTicketPrice(cents: number) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function wallFirstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "Guest";
}

export function slugifyTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "event";
}

export function businessKeyFromName(name: string) {
  return slugifyTitle(name).replace(/-/g, "_").slice(0, 40) || "host";
}
