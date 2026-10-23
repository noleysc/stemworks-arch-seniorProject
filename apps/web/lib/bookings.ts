/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { Booking } from "@prisma/client";
import { z } from "zod";

import { OUTLETS, STATUSES } from "@/lib/catalog";
import { mapImport, type MappedBooking } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";
import { ensureLuminary, listRentalSources } from "@/lib/property";

const statusKeys = STATUSES.map((status) => status.key) as [string, ...string[]];
const outletKeys = OUTLETS.map((outlet) => outlet.key) as [string, ...string[]];

const baseFields = {
  guestName: z.string().trim().min(1, "Guest name is required.").max(160),
  partySize: z.coerce.number().int().min(1).max(40),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real date."),
  confirmationCode: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(statusKeys),
  amount: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
};

export const roomInputSchema = z
  .object({
    ...baseFields,
    channel: z.string().trim().regex(/^[a-z][a-z0-9_]{0,40}$/, "Unknown rental source."),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real departure date."),
    roomType: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .refine((value) => value.departureDate > value.arrivalDate, {
    message: "Departure must be after arrival.",
    path: ["departureDate"],
  });

export const restaurantInputSchema = z.object({
  ...baseFields,
  outlet: z.enum(outletKeys),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/, "Use a reservation time."),
});

export type BookingRecord = {
  id: string;
  kind: string;
  channel: string;
  guestName: string;
  partySize: number;
  arrivalDate: string;
  departureDate: string | null;
  reservationTime: string | null;
  outlet: string | null;
  roomType: string | null;
  confirmationCode: string | null;
  status: string;
  amountCents: number | null;
  notes: string | null;
  source: string;
};

export async function listBookings(filter?: { kind?: string }): Promise<BookingRecord[]> {
  const property = await ensureLuminary();
  const rows = await prisma.booking.findMany({
    where: { propertyId: property.id, ...(filter?.kind ? { kind: filter.kind } : {}) },
    orderBy: [{ arrivalDate: "asc" }, { reservationTime: "asc" }, { guestName: "asc" }],
  });
  return rows.map(toRecord);
}

export async function createRoomBooking(input: z.infer<typeof roomInputSchema>) {
  const property = await ensureLuminary();
  const sources = await listRentalSources();
  if (!sources.some((source) => source.key === input.channel)) {
    throw new Error("That rental source is not registered for this property.");
  }
  return prisma.booking.create({
    data: {
      propertyId: property.id,
      kind: "room",
      channel: input.channel,
      guestName: input.guestName,
      partySize: input.partySize,
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      roomType: emptyToNull(input.roomType),
      confirmationCode: emptyToNull(input.confirmationCode),
      status: input.status,
      amountCents: optionalCents(input.amount),
      notes: emptyToNull(input.notes),
      source: "manual",
    },
  });
}

export async function createRestaurantBooking(input: z.infer<typeof restaurantInputSchema>) {
  const property = await ensureLuminary();
  return prisma.booking.create({
    data: {
      propertyId: property.id,
      kind: "restaurant",
      channel: "restaurant",
      guestName: input.guestName,
      partySize: input.partySize,
      arrivalDate: input.arrivalDate,
      reservationTime: input.reservationTime,
      outlet: input.outlet,
      confirmationCode: emptyToNull(input.confirmationCode),
      status: input.status,
      amountCents: optionalCents(input.amount),
      notes: emptyToNull(input.notes),
      source: "manual",
    },
  });
}

export async function updateBookingStatus(id: string, status: string) {
  if (!statusKeys.includes(status)) {
    throw new Error("Unknown status.");
  }
  return prisma.booking.update({ where: { id }, data: { status } });
}

export async function deleteBooking(id: string) {
  return prisma.booking.delete({ where: { id } });
}

export async function importBookings(stream: string, csv: string) {
  const property = await ensureLuminary();
  const shape = await importShapeFor(stream);
  const mapped = mapImport(stream, csv, shape);
  let created = 0;
  let updated = 0;

  for (const record of mapped.records) {
    const outcome = await upsertImported(property.id, record);
    if (outcome === "created") created += 1;
    else updated += 1;
  }

  return { created, updated, issues: mapped.issues };
}

async function importShapeFor(stream: string) {
  if (stream === "restaurant") return "restaurant" as const;
  const sources = await listRentalSources();
  const source = sources.find((item) => item.key === stream);
  if (!source) {
    throw new Error("That rental source is not registered for this property.");
  }
  return source.importShape;
}

async function upsertImported(propertyId: string, record: MappedBooking): Promise<"created" | "updated"> {
  if (record.confirmationCode) {
    const existing = await prisma.booking.findFirst({
      where: { propertyId, channel: record.channel, confirmationCode: record.confirmationCode },
    });
    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: { ...record, source: "csv" },
      });
      return "updated";
    }
  }

  await prisma.booking.create({ data: { ...record, propertyId, source: "csv" } });
  return "created";
}

function toRecord(row: Booking): BookingRecord {
  return {
    id: row.id,
    kind: row.kind,
    channel: row.channel,
    guestName: row.guestName,
    partySize: row.partySize,
    arrivalDate: row.arrivalDate,
    departureDate: row.departureDate,
    reservationTime: row.reservationTime,
    outlet: row.outlet,
    roomType: row.roomType,
    confirmationCode: row.confirmationCode,
    status: row.status,
    amountCents: row.amountCents,
    notes: row.notes,
    source: row.source,
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function optionalCents(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  return dollarsToCents(value);
}
