/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { BookingBoard } from "@/components/booking-board";
import { RoomForm } from "@/components/room-form";
import { listBookings } from "@/lib/bookings";
import { businessToday } from "@/lib/dates";
import { listRentalSources } from "@/lib/property";

export const dynamic = "force-dynamic";

export default async function RoomsPage({ searchParams }: { searchParams: { source?: string } }) {
  const [bookings, sources, today] = await Promise.all([
    listBookings({ kind: "room" }),
    listRentalSources(),
    Promise.resolve(businessToday()),
  ]);
  const initialSource = sources.some((source) => source.key === searchParams.source) ? searchParams.source : "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl">Rentals</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            All stays for Luminary Hotel & Co. Filter by source. A confirmation code is unique per source, so the
            website and Airbnb never collapse into one row.
          </p>
        </div>
        <RoomForm sources={sources} />
      </div>
      <BookingBoard
        bookings={bookings}
        today={today}
        kind="room"
        sources={sources}
        initialSource={initialSource}
        emptyTitle="No rentals in this view"
        emptyBody="Add a stay, or import an export from one of the property's rental sources on Collect."
      />
    </div>
  );
}
