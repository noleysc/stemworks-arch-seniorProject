/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { aggregateRentals } from "@/lib/aggregate";
import { prisma } from "@/lib/db";
import { businessToday } from "@/lib/dates";
import { ensureLuminary, LUMINARY, listRentalSources } from "@/lib/property";

export async function loadRentalAggregate(businessDate = businessToday()) {
  const property = await ensureLuminary();
  const sources = await listRentalSources();
  const bookings = await prisma.booking.findMany({ where: { propertyId: property.id } });
  const totals = aggregateRentals({
    businessDate,
    sources,
    bookings: bookings.map((booking) => ({
      kind: booking.kind,
      channel: booking.channel,
      status: booking.status,
      arrivalDate: booking.arrivalDate,
      departureDate: booking.departureDate,
      amountCents: booking.amountCents,
    })),
  });

  return {
    property: {
      key: property.key,
      name: property.name,
      address: property.address,
      timezone: property.timezone,
      keys: property.keys,
    },
    businessDate,
    timezone: LUMINARY.timezone,
    ...totals,
  };
}
