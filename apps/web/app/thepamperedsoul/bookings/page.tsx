/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { AppointmentBoard } from "@/components/experiences/appointment-board";
import { MassageBookImportPanel } from "@/components/experiences/massagebook-import-panel";
import { StaffBookForm } from "@/components/experiences/staff-book-form";
import { listAppointments } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export default async function ServiceBookingsPage() {
  const appointments = await listAppointments({ includeCancelled: true });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Service bookings</h1>
          <p className="mt-2 text-sm text-slate-600">
            Reschedule, cancel, checkout, payments, and MassageBook import for spa appointments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/thepamperedsoul/clients"
            className="rounded-full border border-slate-900/15 px-4 py-2 text-sm text-slate-900"
          >
            Clients
          </Link>
          <Link
            href="/book"
            className="rounded-full border border-slate-900/15 px-4 py-2 text-sm text-slate-900"
            target="_blank"
          >
            Open client booking
          </Link>
          <Link
            href="/thepamperedsoul/calendar"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-[#eef2f6]"
          >
            Calendar
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <StaffBookForm />
        <MassageBookImportPanel />
      </div>

      <AppointmentBoard appointments={appointments} />
    </div>
  );
}
