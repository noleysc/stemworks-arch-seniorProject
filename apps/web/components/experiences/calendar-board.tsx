/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildMonthGrid } from "@/lib/experiences/calendar";
import type { CalendarItem } from "@/lib/experiences/calendar";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const kindStyles: Record<CalendarItem["kind"], string> = {
  event: "bg-teal-800 text-white",
  appointment: "bg-amber-800 text-white",
  ticketed_guest: "bg-slate-700 text-white",
};

export function CalendarBoard() {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  const selectedItems = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  async function load(nextYear = year, nextMonth = month) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/experiences/calendar?year=${nextYear}&month=${nextMonth}`);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Could not load calendar.");
      }
      setItems(body.items as CalendarItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load calendar.");
      setItems([]);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(year, month + delta, 1));
    setYear(date.getUTCFullYear());
    setMonth(date.getUTCMonth());
    setSelectedDate(null);
  }

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">{monthLabel}</h2>
          <p className="mt-1 text-sm text-slate-600">Events, individual service bookings, and ticketed guests.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => shiftMonth(-1)}>
            Previous
          </Button>
          <Button type="button" variant="outline" onClick={() => shiftMonth(1)}>
            Next
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {pending ? <p className="text-sm text-slate-600">Loading calendar…</p> : null}

      <div className="overflow-hidden rounded-3xl border border-slate-900/10 bg-white/90">
        <div className="grid grid-cols-7 border-b border-slate-900/10 bg-slate-50 text-center text-xs uppercase tracking-[0.14em] text-slate-500">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="min-h-[110px] border-b border-r border-slate-900/5 bg-slate-50/40" />;
            }
            const dayItems = byDate.get(cell.date) ?? [];
            const active = selectedDate === cell.date;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={cn(
                  "min-h-[110px] border-b border-r border-slate-900/5 p-2 text-left align-top hover:bg-slate-50",
                  active && "bg-slate-100",
                )}
              >
                <p className="text-sm font-medium text-slate-900">{cell.day}</p>
                <ul className="mt-2 space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <li
                      key={item.id}
                      className={cn("truncate rounded px-1.5 py-0.5 text-[11px]", kindStyles[item.kind])}
                    >
                      {item.title}
                    </li>
                  ))}
                  {dayItems.length > 3 ? (
                    <li className="text-[11px] text-slate-500">+{dayItems.length - 3} more</li>
                  ) : null}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
        <h3 className="font-display text-2xl">
          {selectedDate ? `On ${selectedDate}` : "Select a day"}
        </h3>
        {!selectedDate ? (
          <p className="mt-2 text-sm text-slate-600">Click a day to see events and booked clients.</p>
        ) : selectedItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nothing booked on this day.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {selectedItems.map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      {item.kind.replace("_", " ")}
                      {item.timeLabel ? ` · ${item.timeLabel}` : ""}
                    </p>
                    <p className="mt-1 font-medium text-slate-950">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.detail}</p>
                  </div>
                  {item.href ? (
                    <Link href={item.href} className="text-sm underline">
                      Open
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
