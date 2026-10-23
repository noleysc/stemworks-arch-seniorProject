/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { matchOutlet, type OutletKey, type RoomChannel } from "@/lib/catalog";
import { parseBusinessDate, parseTime } from "@/lib/dates";
import { dollarsToCents } from "@/lib/money";

export type ImportStream = RoomChannel | "restaurant" | (string & {});
export type ImportShape = "stay" | "airbnb" | "restaurant";

export type MappedBooking = {
  kind: "room" | "restaurant";
  channel: ImportStream;
  guestName: string;
  partySize: number;
  arrivalDate: string;
  departureDate: string | null;
  reservationTime: string | null;
  outlet: OutletKey | null;
  roomType: string | null;
  confirmationCode: string | null;
  status: string;
  amountCents: number | null;
  notes: string | null;
};

export type ImportIssue = { row: number; message: string };

const HEADER_ALIASES: Record<string, string> = {
  confirmation_code: "confirmation",
  confirmation_number: "confirmation",
  confirmation: "confirmation",
  code: "confirmation",
  reservation_code: "confirmation",
  guest_name: "guest",
  guest: "guest",
  name: "guest",
  guest_full_name: "guest",
  arrival: "arrival",
  arrival_date: "arrival",
  start_date: "arrival",
  check_in: "arrival",
  checkin: "arrival",
  date: "arrival",
  departure: "departure",
  departure_date: "departure",
  end_date: "departure",
  check_out: "departure",
  checkout: "departure",
  room_type: "room",
  room: "room",
  listing: "room",
  party_size: "party",
  guests: "party",
  adults: "adults",
  of_adults: "adults",
  number_of_adults: "adults",
  of_guests: "party",
  number_of_guests: "party",
  children: "children",
  of_children: "children",
  number_of_children: "children",
  time: "time",
  reservation_time: "time",
  outlet: "outlet",
  restaurant: "outlet",
  venue: "outlet",
  amount: "amount",
  amount_cents: "amount_cents",
  earnings: "amount",
  total: "amount",
  total_price: "amount",
  rate: "amount",
  status: "status",
  notes: "notes",
  note: "notes",
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else if (character !== "\r") {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export function mapImport(stream: string, text: string, shape?: ImportShape): {
  records: MappedBooking[];
  issues: ImportIssue[];
} {
  const resolved = resolveShape(stream, shape);
  const table = parseCsv(text);
  if (table.length === 0) {
    return { records: [], issues: [{ row: 1, message: "The file is empty." }] };
  }

  const headers = table[0].map(normalizeHeader);
  const records: MappedBooking[] = [];
  const issues: ImportIssue[] = [];

  table.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const values = Object.fromEntries(
      headers.map((header, cellIndex) => [header, (cells[cellIndex] ?? "").trim()]),
    );
    try {
      records.push(mapRow(stream, resolved, values));
    } catch (error) {
      issues.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "This row could not be read.",
      });
    }
  });

  return { records, issues };
}

export function templateCsv(stream: string, shape?: ImportShape): string {
  const resolved = resolveShape(stream, shape);
  if (resolved === "airbnb") {
    return "Confirmation code,Guest name,Start date,End date,Listing,# of adults,# of children,Earnings,Status\n";
  }
  if (resolved === "restaurant") {
    return "outlet,guest_name,date,time,party_size,confirmation_code,amount,status,notes\n";
  }
  return "confirmation_code,guest_name,arrival_date,departure_date,room_type,party_size,amount,status,notes\n";
}

function resolveShape(stream: string, shape?: ImportShape): ImportShape {
  if (shape) return shape;
  if (stream === "restaurant") return "restaurant";
  if (stream === "airbnb") return "airbnb";
  return "stay";
}

function mapRow(stream: string, shape: ImportShape, values: Record<string, string>): MappedBooking {
  const guestName = values.guest ?? "";
  if (!guestName) throw new Error("Guest name is required.");

  const arrivalDate = parseBusinessDate(values.arrival ?? "");
  if (!arrivalDate) throw new Error("Arrival date is missing or not a real date.");

  const adults = numberOrNull(values.adults);
  const children = numberOrNull(values.children);
  const partyField = numberOrNull(values.party);
  const partySize = partyField ?? (adults ?? 0) + (children ?? 0);
  if (!partySize || partySize < 1) throw new Error("Party size must be at least 1.");

  const status = mapStatus(values.status);
  const amountCents = readAmount(values);
  const confirmationCode = values.confirmation || null;
  const notes = values.notes || null;

  if (shape === "restaurant") {
    const outlet = matchOutlet(values.outlet ?? "");
    if (!outlet) {
      throw new Error("Outlet is required. Use a Luminary outlet name, such as Silver King or Ella Mae's.");
    }
    const reservationTime = parseTime(values.time ?? "");
    if (!reservationTime) throw new Error("Reservation time is required, such as 7:30 PM.");
    return {
      kind: "restaurant",
      channel: "restaurant",
      guestName,
      partySize,
      arrivalDate,
      departureDate: null,
      reservationTime,
      outlet,
      roomType: null,
      confirmationCode,
      status,
      amountCents,
      notes,
    };
  }

  const departureDate = parseBusinessDate(values.departure ?? "");
  if (!departureDate) throw new Error("Departure date is missing or not a real date.");
  if (departureDate <= arrivalDate) {
    throw new Error("Departure must be after arrival.");
  }

  return {
    kind: "room",
    channel: stream,
    guestName,
    partySize,
    arrivalDate,
    departureDate,
    reservationTime: null,
    outlet: null,
    roomType: values.room || null,
    confirmationCode,
    status,
    amountCents,
    notes,
  };
}

function readAmount(values: Record<string, string>): number | null {
  if (values.amount_cents) {
    if (!/^-?\d+$/.test(values.amount_cents)) throw new Error("amount_cents must be a whole number of cents.");
    return Number(values.amount_cents);
  }
  if (!values.amount) return null;
  return dollarsToCents(values.amount);
}

function mapStatus(raw: string | undefined): string {
  const value = (raw ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (!value) return "confirmed";
  const table: Record<string, string> = {
    inquiry: "inquiry",
    request: "inquiry",
    pending: "inquiry",
    confirmed: "confirmed",
    accepted: "confirmed",
    booked: "confirmed",
    reserved: "confirmed",
    arrived: "arrived",
    "checked in": "arrived",
    "in house": "arrived",
    current: "arrived",
    seated: "arrived",
    completed: "completed",
    past: "completed",
    "checked out": "completed",
    cancelled: "cancelled",
    canceled: "cancelled",
    "no show": "no_show",
  };
  const mapped = table[value];
  if (!mapped) throw new Error(`Status "${raw}" is not one this desk uses.`);
  return mapped;
}

function numberOrNull(raw: string | undefined): number | null {
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) throw new Error(`"${raw}" is not a whole number.`);
  return Number(raw);
}

function normalizeHeader(header: string): string {
  const key = header
    .trim()
    .toLowerCase()
    .replace(/#/g, " number ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_+/g, "_");
  return HEADER_ALIASES[key] ?? key;
}
