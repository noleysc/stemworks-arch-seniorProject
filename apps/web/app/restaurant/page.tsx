/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { BookingBoard } from "@/components/booking-board";
import { RestaurantForm } from "@/components/restaurant-form";
import { listBookings } from "@/lib/bookings";
import { businessToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function RestaurantPage() {
  const bookings = await listBookings({ kind: "restaurant" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl">Restaurant</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Tables for Silver King, Ella Mae&apos;s, Chips, Oxbow, Beacon, Dean Street, the pool bar, and in-room dining.
          </p>
        </div>
        <RestaurantForm />
      </div>
      <BookingBoard
        bookings={bookings}
        today={businessToday()}
        kind="restaurant"
        emptyTitle="No tables in this view"
        emptyBody="Add a reservation, or import the outlet's list from Collect. Silver King books through OpenTable and by phone; either source can be typed or exported in."
      />
    </div>
  );
}
