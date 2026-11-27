/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  APPOINTMENT_STATUSES,
  appointmentStatusLabel,
  paymentStatusLabel,
  type ServiceAppointmentRecord,
} from "@/lib/experiences/appointment-catalog";
import { APPOINTMENT_TIME_OPTIONS } from "@/lib/experiences/appointment-times";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { formatDuration, spaServicesByCategory } from "@/lib/experiences/spa-menu";
import { requestErrorMessage, requestJson } from "@/lib/http";

export function AppointmentBoard({ appointments }: { appointments: ServiceAppointmentRecord[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "all" | "cancelled">("upcoming");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const services = useMemo(
    () => spaServicesByCategory().flatMap((group) => group.services.filter((s) => s.menuPriceCents != null)),
    [],
  );

  const visible = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    return appointments.filter((row) => {
      if (filter === "cancelled") return row.status === "cancelled";
      if (filter === "upcoming") {
        return row.status !== "cancelled" && row.appointmentOn >= today;
      }
      return row.status !== "cancelled";
    });
  }, [appointments, filter]);

  async function patch(id: string, body: Record<string, unknown>, fallback: string) {
    setPendingId(id);
    setError(null);
    try {
      await requestJson(`/api/experiences/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, fallback);
      setRescheduleId(null);
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, fallback));
    } finally {
      setPendingId(null);
    }
  }

  async function collect(id: string, kind: "deposit" | "balance" | "full" | "refund") {
    setPendingId(id);
    setError(null);
    try {
      await requestJson(`/api/experiences/appointments/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "refund" ? { action: "refund" } : { kind, method: "manual" }),
      }, "We couldn’t record that payment. Check the amount and try again.");
      setPayId(null);
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t record that payment. Check the amount and try again."));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["upcoming", "Upcoming"],
            ["all", "All active"],
            ["cancelled", "Cancelled"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === key ? "bg-slate-950 text-[#eef2f6]" : "border border-slate-900/15 text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
        <a
          href="/api/experiences/appointments/export?includeCancelled=1"
          className="rounded-full border border-slate-900/15 px-3 py-1.5 text-sm text-slate-700"
        >
          Export CSV
        </a>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-600">No appointments in this view.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((appointment) => {
            const busy = pendingId === appointment.id;
            return (
              <li key={appointment.id} className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {appointment.appointmentOn} · {appointment.startsAtLabel} ·{" "}
                      {appointmentStatusLabel(appointment.status)} ·{" "}
                      {paymentStatusLabel(appointment.paymentStatus)}
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
                        appointment.amountPaidCents > 0
                          ? `collected ${formatTicketPrice(appointment.amountPaidCents)}`
                          : null,
                        appointment.balanceDueCents > 0
                          ? `due ${formatTicketPrice(appointment.balanceDueCents)}`
                          : null,
                        appointment.therapistLabel ? `with ${appointment.therapistLabel}` : null,
                        appointment.confirmationCode,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {appointment.preferences ? (
                      <p className="mt-2 text-sm text-slate-600">Prefs: {appointment.preferences}</p>
                    ) : null}
                    {appointment.notes ? <p className="mt-1 text-sm text-slate-600">{appointment.notes}</p> : null}
                    {appointment.staffNotes ? (
                      <p className="mt-1 text-sm text-slate-500">Staff: {appointment.staffNotes}</p>
                    ) : null}
                  </div>
                </div>

                {appointment.status !== "cancelled" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {APPOINTMENT_STATUSES.filter((s) => s.key !== "cancelled").map((status) => (
                      <Button
                        key={status.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || appointment.status === status.key}
                        onClick={() =>
                          patch(appointment.id, { status: status.key }, "We couldn’t update that status.")
                        }
                      >
                        {status.label}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setRescheduleId(rescheduleId === appointment.id ? null : appointment.id)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setPayId(payId === appointment.id ? null : appointment.id)}
                    >
                      Payment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || Boolean(appointment.confirmationSentAt)}
                      onClick={() =>
                        patch(
                          appointment.id,
                          { markConfirmationSent: true, status: "confirmed" },
                          "We couldn’t mark the confirmation sent.",
                        )
                      }
                    >
                      {appointment.confirmationSentAt ? "Confirmation logged" : "Log confirmation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        patch(appointment.id, { action: "cancel" }, "We couldn’t cancel that appointment.")
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null}

                {rescheduleId === appointment.id ? (
                  <form
                    className="mt-4 grid gap-3 rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      patch(
                        appointment.id,
                        {
                          action: "reschedule",
                          appointmentOn: form.get("appointmentOn"),
                          startsAtLabel: form.get("startsAtLabel"),
                          serviceKey: form.get("serviceKey"),
                          therapistLabel: form.get("therapistLabel"),
                        },
                        "We couldn’t reschedule that appointment.",
                      );
                    }}
                  >
                    <div>
                      <Label htmlFor={`date-${appointment.id}`}>Date</Label>
                      <Input
                        id={`date-${appointment.id}`}
                        name="appointmentOn"
                        type="date"
                        required
                        defaultValue={appointment.appointmentOn}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`time-${appointment.id}`}>Time</Label>
                      <select
                        id={`time-${appointment.id}`}
                        name="startsAtLabel"
                        defaultValue={appointment.startsAtLabel}
                        className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                      >
                        {APPOINTMENT_TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`service-${appointment.id}`}>Service</Label>
                      <select
                        id={`service-${appointment.id}`}
                        name="serviceKey"
                        defaultValue={appointment.serviceKey}
                        className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                      >
                        {services.map((service) => (
                          <option key={service.key} value={service.key}>
                            {service.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`therapist-${appointment.id}`}>Therapist</Label>
                      <Input
                        id={`therapist-${appointment.id}`}
                        name="therapistLabel"
                        defaultValue={appointment.therapistLabel ?? ""}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="submit" disabled={busy}>
                        Save new time
                      </Button>
                    </div>
                  </form>
                ) : null}

                {payId === appointment.id ? (
                  <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4">
                    <Button type="button" size="sm" disabled={busy} onClick={() => collect(appointment.id, "deposit")}>
                      Record deposit
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={() => collect(appointment.id, "balance")}>
                      Record balance / checkout
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={() => collect(appointment.id, "full")}>
                      Record full payment
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy || appointment.amountPaidCents <= 0}
                      onClick={() => collect(appointment.id, "refund")}
                    >
                      Mark refunded
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
