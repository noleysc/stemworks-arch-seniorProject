/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { channelLabel, outletLabel, statusLabel } from "@/lib/catalog";
import { listBookings } from "@/lib/bookings";
import { businessToday, formatDate, formatTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = businessToday();
  const bookings = await listBookings();
  const open = bookings.filter((booking) => booking.status !== "completed" && booking.status !== "cancelled");
  const luminaryRooms = open.filter((booking) => booking.channel === "luminary_website" && (booking.departureDate ?? booking.arrivalDate) >= today);
  const airbnbRooms = open.filter((booking) => booking.channel === "airbnb" && (booking.departureDate ?? booking.arrivalDate) >= today);
  const tables = open.filter((booking) => booking.kind === "restaurant" && booking.arrivalDate >= today);
  const arrivals = open.filter((booking) => booking.kind === "room" && booking.arrivalDate === today);
  const tonight = open
    .filter((booking) => booking.kind === "restaurant" && booking.arrivalDate === today)
    .sort((a, b) => (a.reservationTime ?? "").localeCompare(b.reservationTime ?? ""));
  const covers = tonight.reduce((sum, booking) => sum + booking.partySize, 0);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-stone-500">Business date {formatDate(today)} · America/New_York</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-stone-950">What the hotel is holding</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Room stays from the Luminary website and from Airbnb, and tables at the outlets, in one book. The public
          website does not contain this book. The desk is filled by what the team types or exports.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Luminary website" value={String(luminaryRooms.length)} detail="open room stays" href="/rooms" />
        <Stat label="Airbnb" value={String(airbnbRooms.length)} detail="open room stays" href="/rooms" />
        <Stat label="Restaurant" value={String(tables.reduce((sum, booking) => sum + booking.partySize, 0))} detail="upcoming covers" href="/restaurant" />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-2xl">Arrivals today</h2>
          {arrivals.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-stone-600">No room arrivals on this business date.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {arrivals.map((booking) => (
                <li key={booking.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{booking.guestName}</span>
                    <span className="text-stone-500"> · {channelLabel(booking.channel)}</span>
                  </span>
                  <span className="text-stone-500">{statusLabel(booking.status, "room")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-2xl">Tables today</h2>
          <p className="mt-1 text-sm text-stone-500">{covers} covers</p>
          {tonight.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-stone-600">No restaurant reservations on this business date.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {tonight.map((booking) => (
                <li key={booking.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{formatTime(booking.reservationTime)}</span>
                    <span> {booking.guestName}</span>
                    <span className="text-stone-500"> · {outletLabel(booking.outlet)} · {booking.partySize}</span>
                  </span>
                  <span className="text-stone-500">{formatMoney(booking.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-sm text-stone-500">
        Bring a file in on <Link className="underline underline-offset-4" href="/import">Collect</Link>.
      </p>
    </div>
  );
}

function Stat({ label, value, detail, href }: { label: string; value: string; detail: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-400">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
      <p className="text-sm text-stone-500">{detail}</p>
    </Link>
  );
}
