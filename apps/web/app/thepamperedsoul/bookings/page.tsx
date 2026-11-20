/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { listAppointments } from "@/lib/experiences/appointments";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { formatDuration } from "@/lib/experiences/spa-menu";

export const dynamic = "force-dynamic";

export default async function ServiceBookingsPage() {
  const appointments = await listAppointments();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Service bookings</h1>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {appointments.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-900/15 bg-white/70 p-8">
          <h2 className="font-display text-2xl">No service bookings yet</h2>
        </section>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="rounded-3xl border border-slate-900/10 bg-white/90 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {appointment.appointmentOn} · {appointment.startsAtLabel} · {appointment.status}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-slate-950">{appointment.serviceTitle}</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    {appointment.clientName}
                    {appointment.clientPhone ? ` · ${appointment.clientPhone}` : ""}
                    {appointment.clientEmail ? ` · ${appointment.clientEmail}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[
                      formatDuration(appointment.durationMinutes),
                      formatTicketPrice(appointment.priceCents),
                      appointment.confirmationCode,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {appointment.notes ? <p className="mt-2 text-sm text-slate-600">{appointment.notes}</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
