/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/** Shared open hours for public booking and staff desk. */
export const APPOINTMENT_TIME_OPTIONS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
] as const;

/** Parse labels like "2:00 PM" into minutes from midnight. Returns null when unparseable. */
export function parseTimeLabelToMinutes(label: string): number | null {
  const trimmed = label.trim();
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute < 0 || minute > 59) return null;
  if (hour < 1 || hour > 12) return null;
  if (meridiem === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }
  return hour * 60 + minute;
}

export function appointmentWindowMinutes(startsAtLabel: string, durationMinutes: number | null | undefined) {
  const start = parseTimeLabelToMinutes(startsAtLabel);
  if (start == null) return null;
  const duration = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  return { start, end: start + duration };
}

export function windowsOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
) {
  return a.start < b.end && b.start < a.end;
}
