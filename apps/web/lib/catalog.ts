/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

export const OUTLETS = [
  { key: "silver_king", label: "Silver King Coastal Kitchen" },
  { key: "ella_maes", label: "Ella Mae's Diner" },
  { key: "chips", label: "Chips Sports Pub" },
  { key: "oxbow", label: "Oxbow Bar & Grill" },
  { key: "beacon", label: "Beacon Social Drinkery" },
  { key: "dean_street", label: "Dean Street Coffee" },
  { key: "pool_bar", label: "Pool Bar" },
  { key: "in_room_dining", label: "In-room dining" },
] as const;

export type OutletKey = (typeof OUTLETS)[number]["key"];

export const ROOM_CHANNELS = [
  { key: "luminary_website", label: "Luminary website" },
  { key: "airbnb", label: "Airbnb" },
] as const;

export type RoomChannel = (typeof ROOM_CHANNELS)[number]["key"];

export const STATUSES = [
  { key: "inquiry", label: "Inquiry" },
  { key: "confirmed", label: "Confirmed" },
  { key: "arrived", label: "Arrived" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "no_show", label: "No-show" },
] as const;

export type BookingStatus = (typeof STATUSES)[number]["key"];

export function outletLabel(key: string | null | undefined): string {
  return OUTLETS.find((outlet) => outlet.key === key)?.label ?? "—";
}

export function channelLabel(key: string): string {
  if (key === "restaurant") return "Restaurant";
  return ROOM_CHANNELS.find((channel) => channel.key === key)?.label ?? key;
}

export function statusLabel(key: string, kind: string): string {
  if (key === "arrived" && kind === "room") return "In house";
  if (key === "arrived" && kind === "restaurant") return "Seated";
  return STATUSES.find((status) => status.key === key)?.label ?? key;
}

export function matchOutlet(raw: string): OutletKey | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const direct = OUTLETS.find((outlet) => outlet.key === trimmed || outlet.key === trimmed.toLowerCase());
  if (direct) return direct.key;

  const norm = trimmed
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  const aliases: Record<string, OutletKey> = {
    "silver king": "silver_king",
    "silver king coastal kitchen": "silver_king",
    "the silver king": "silver_king",
    "ella mae": "ella_maes",
    "ella maes": "ella_maes",
    "ella maes diner": "ella_maes",
    chips: "chips",
    "chips sports pub": "chips",
    oxbow: "oxbow",
    "oxbow bar and grill": "oxbow",
    "oxbow bar grill": "oxbow",
    beacon: "beacon",
    "beacon social drinkery": "beacon",
    "dean street": "dean_street",
    "dean street coffee": "dean_street",
    "dean street coffee roastery": "dean_street",
    "pool bar": "pool_bar",
    "in room dining": "in_room_dining",
    "room service": "in_room_dining",
  };

  return aliases[norm] ?? null;
}
