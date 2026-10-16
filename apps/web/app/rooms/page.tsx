/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { BookingBoard } from "@/components/booking-board";
import { RoomForm } from "@/components/room-form";
import { listBookings } from "@/lib/bookings";
import { businessToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const [bookings, today] = await Promise.all([listBookings({ kind: "room" }), Promise.resolve(businessToday())]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl">Rooms</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Stays sold on the Luminary website and stays sold on Airbnb. Each booking keeps the channel it came from.
          </p>
        </div>
        <RoomForm />
      </div>
      <BookingBoard
        bookings={bookings}
        today={today}
        kind="room"
        emptyTitle="No room stays in this view"
        emptyBody="Add a stay, or import a Luminary website report or an Airbnb reservation export from Collect."
      />
    </div>
  );
}
