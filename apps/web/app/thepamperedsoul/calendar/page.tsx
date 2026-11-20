/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { Suspense } from "react";

import { CalendarBoard } from "@/components/experiences/calendar-board";

export const dynamic = "force-dynamic";

export default function ExperiencesCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Schedule</h1>
      </div>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading calendar…</p>}>
        <CalendarBoard />
      </Suspense>
    </div>
  );
}
