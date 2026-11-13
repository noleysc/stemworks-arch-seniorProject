/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { listAppointments } from "@/lib/experiences/appointments";
import { listExperienceEvents } from "@/lib/experiences/events";
import { prisma } from "@/lib/db";

export type CalendarItem = {
  id: string;
  kind: "event" | "appointment" | "ticketed_guest";
  date: string;
  timeLabel: string | null;
  title: string;
  detail: string;
  href?: string;
  status: string;
};

export async function listCalendarItems(from: string, to: string): Promise<CalendarItem[]> {
  const [events, appointments, registrations] = await Promise.all([
    listExperienceEvents(),
    listAppointments({ from, to }),
    prisma.eventRegistration.findMany({
      where: {
        status: { not: "cancelled" },
        event: {
          startsOn: { gte: from, lte: to },
          status: { in: ["open", "full", "completed"] },
        },
      },
      include: {
        guest: true,
        event: true,
        tier: true,
      },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const items: CalendarItem[] = [];

  for (const event of events) {
    if (event.startsOn < from || event.startsOn > to) continue;
    if (event.status === "cancelled") continue;
    items.push({
      id: `event-${event.id}`,
      kind: "event",
      date: event.startsOn,
      timeLabel: event.startsAtLabel,
      title: event.title,
      detail: `${event.ticketCount}/${event.capacity} tickets · ${event.statusLabel}`,
      href: `/experiences/${event.slug}`,
      status: event.status,
    });
  }

  for (const appointment of appointments) {
    items.push({
      id: `appt-${appointment.id}`,
      kind: "appointment",
      date: appointment.appointmentOn,
      timeLabel: appointment.startsAtLabel,
      title: appointment.serviceTitle,
      detail: `${appointment.clientName}${appointment.confirmationCode ? ` · ${appointment.confirmationCode}` : ""}`,
      href: "/experiences/bookings",
      status: appointment.status,
    });
  }

  for (const registration of registrations) {
    items.push({
      id: `guest-${registration.id}`,
      kind: "ticketed_guest",
      date: registration.event.startsOn,
      timeLabel: registration.event.startsAtLabel,
      title: registration.guest.fullName,
      detail: `${registration.event.title}${registration.tier ? ` · ${registration.tier.label}` : ""} · ${registration.ticketQuantity} ticket${registration.ticketQuantity === 1 ? "" : "s"}`,
      href: `/experiences/${registration.event.slug}`,
      status: registration.status,
    });
  }

  return items.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return (a.timeLabel ?? "").localeCompare(b.timeLabel ?? "");
  });
}

export function monthBounds(year: number, monthIndex: number) {
  const from = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const to = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to, lastDay };
}

export function buildMonthGrid(year: number, monthIndex: number) {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const { lastDay } = monthBounds(year, monthIndex);
  const cells: ({ date: string; day: number } | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({
      day,
      date: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
