/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { RentalSourceRecord } from "@/lib/property";

export type AggregateBooking = {
  kind: string;
  channel: string;
  status: string;
  arrivalDate: string;
  departureDate: string | null;
  amountCents: number | null;
};

export type SourceTotal = RentalSourceRecord & {
  openCount: number;
  confirmedCents: number;
  potentialCents: number;
};

const openStatuses = new Set(["inquiry", "confirmed", "arrived"]);

export function aggregateRentals(input: {
  businessDate: string;
  sources: RentalSourceRecord[];
  bookings: AggregateBooking[];
}): { rentals: { openCount: number; confirmedCents: number; potentialCents: number }; sources: SourceTotal[] } {
  const sourceKeys = new Set(input.sources.map((source) => source.key));
  const rentals = input.bookings.filter((booking) => booking.kind === "room" && sourceKeys.has(booking.channel));

  return {
    rentals: tally(rentals, input.businessDate),
    sources: input.sources.map((source) => ({
      ...source,
      ...tally(
        rentals.filter((booking) => booking.channel === source.key),
        input.businessDate,
      ),
    })),
  };
}

function tally(rows: AggregateBooking[], businessDate: string) {
  const open = rows.filter((row) => isOpenRental(row, businessDate));
  const confirmedCents = sum(open.filter((row) => row.status === "confirmed" || row.status === "arrived"));
  const potentialCents = confirmedCents + sum(open.filter((row) => row.status === "inquiry"));
  return { openCount: open.length, confirmedCents, potentialCents };
}

function isOpenRental(row: AggregateBooking, businessDate: string) {
  if (!openStatuses.has(row.status)) return false;
  return (row.departureDate ?? row.arrivalDate) >= businessDate;
}

function sum(rows: AggregateBooking[]) {
  return rows.reduce((total, row) => total + (row.amountCents ?? 0), 0);
}
