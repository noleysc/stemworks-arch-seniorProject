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

/** Participating businesses on the Dec 18 holiday pilot. Keys are stable consent scopes. */
export const PILOT_VENDORS = [
  {
    businessKey: "jade_haven",
    displayName: "Jade Haven Spa",
    roleLabel: "Host · wellness",
    sortOrder: 0,
  },
  {
    businessKey: "jade_flowers",
    displayName: "Jade Flowers",
    roleLabel: "Vendor · florals",
    sortOrder: 1,
  },
  {
    businessKey: "charcuterie_co",
    displayName: "Harbor Charcuterie",
    roleLabel: "Vendor · food",
    sortOrder: 2,
  },
] as const;

/** Partiful-style invite: social, ticketed, light. Opt-in = marketing consent. */
export const HOLIDAY_EVENT = {
  slug: "holiday-spa-experience-2026",
  title: "Holiday Spa Experience",
  summary:
    "An evening of spa rituals, florals, and tasting tables. Grab tickets, see who's going, and tell hosts if they can keep in touch.",
  location: "Jade Haven · Fort Myers",
  startsOn: "2026-12-18",
  endsOn: "2026-12-18",
  startsAtLabel: "Friday · 6:00 PM",
  capacity: 60,
  ticketPriceCents: 6500,
  hostDisplayName: "Jade Haven",
  coverTone: "ink",
  disclosureText:
    "Buying a ticket shares your details with the organizer for this event. Checking a box below grants that business marketing consent (email) after the night. Leave boxes unchecked if you only want event updates. Opting in is marketing consent — one ticket does not consent for every vendor.",
} as const;

export const HOLIDAY_TICKET_TIERS = [
  {
    key: "early_bird",
    label: "Early bird",
    description: "Limited — includes welcome pour",
    priceCents: 4500,
    quantityAvailable: 20,
    sortOrder: 0,
  },
  {
    key: "general",
    label: "General admission",
    description: "Full evening access",
    priceCents: 6500,
    quantityAvailable: 30,
    sortOrder: 1,
  },
  {
    key: "vip",
    label: "VIP lounge",
    description: "Priority check-in + tasting flight",
    priceCents: 12000,
    quantityAvailable: 10,
    sortOrder: 2,
  },
] as const;

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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function wallFirstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "Guest";
}
