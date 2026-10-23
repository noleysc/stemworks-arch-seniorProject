/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { channelLabel, outletLabel, STATUSES, statusLabel } from "@/lib/catalog";
import { formatDate, formatTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { BookingRecord } from "@/lib/bookings";

export function BookingBoard({
  bookings,
  today,
  kind,
  emptyTitle,
  emptyBody,
  sources = [],
  initialSource = "all",
}: {
  bookings: BookingRecord[];
  today: string;
  kind: "room" | "restaurant";
  emptyTitle: string;
  emptyBody: string;
  sources?: { key: string; label: string }[];
  initialSource?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"upcoming" | "all">("upcoming");
  const [source, setSource] = useState(initialSource);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (scope === "upcoming" && !isUpcoming(booking, today)) return false;
      if (kind === "room" && source !== "all" && booking.channel !== source) return false;
      if (!needle) return true;
      const haystack = [booking.guestName, booking.confirmationCode, booking.roomType, outletLabel(booking.outlet)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [bookings, kind, query, scope, source, today]);

  async function changeStatus(id: string, status: string) {
    setPendingId(id);
    setError(null);
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPendingId(null);
    if (!response.ok) {
      setError("The status did not save. Try it again.");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    setPendingId(id);
    setError(null);
    const response = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setPendingId(null);
    if (!response.ok) {
      setError("That booking could not be removed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={kind === "room" ? "Search guest, code, or room" : "Search guest, code, or outlet"}
          className="sm:max-w-sm"
        />
        <div className="flex rounded-full bg-stone-100 p-1 text-sm">
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${scope === "upcoming" ? "bg-white shadow-sm" : "text-stone-600"}`}
            onClick={() => setScope("upcoming")}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${scope === "all" ? "bg-white shadow-sm" : "text-stone-600"}`}
            onClick={() => setScope("all")}
          >
            All
          </button>
        </div>
        {kind === "room" && sources.length > 0 ? (
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-10">
          <p className="font-display text-2xl text-stone-950">{emptyTitle}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">{emptyBody}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((booking) => (
            <li key={booking.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-stone-950">{booking.guestName}</h3>
                    <Badge variant="secondary">{sources.find((item) => item.key === booking.channel)?.label ?? channelLabel(booking.channel)}</Badge>
                    {booking.confirmationCode ? (
                      <span className="font-mono text-xs text-stone-500">{booking.confirmationCode}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {kind === "room" ? (
                      <>
                        {formatDate(booking.arrivalDate)} to {formatDate(booking.departureDate)}
                        {booking.roomType ? ` · ${booking.roomType}` : ""}
                        {` · ${booking.partySize} ${booking.partySize === 1 ? "guest" : "guests"}`}
                      </>
                    ) : (
                      <>
                        {outletLabel(booking.outlet)} · {formatDate(booking.arrivalDate)} · {formatTime(booking.reservationTime)}
                        {` · party of ${booking.partySize}`}
                      </>
                    )}
                  </p>
                  {booking.notes ? <p className="mt-2 text-sm text-stone-500">{booking.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <p className="min-w-20 text-sm font-medium text-stone-900">{formatMoney(booking.amountCents)}</p>
                  <Select
                    value={booking.status}
                    onValueChange={(status) => changeStatus(booking.id, status)}
                    disabled={pendingId === booking.id}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>{statusLabel(booking.status, booking.kind)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.key} value={status.key}>
                          {statusLabel(status.key, booking.kind)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === booking.id}
                    onClick={() => remove(booking.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function isUpcoming(booking: BookingRecord, today: string) {
  if (booking.status === "completed" || booking.status === "cancelled") return false;
  if (booking.kind === "room") return (booking.departureDate ?? booking.arrivalDate) >= today;
  return booking.arrivalDate >= today;
}
