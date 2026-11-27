/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APPOINTMENT_TIME_OPTIONS } from "@/lib/experiences/appointment-times";
import { formatDuration, formatMenuPrice, spaServicesByCategory } from "@/lib/experiences/spa-menu";
import { requestErrorMessage, requestJson } from "@/lib/http";

export function StaffBookForm() {
  const router = useRouter();
  const bookable = useMemo(
    () => spaServicesByCategory().flatMap((group) => group.services.filter((s) => s.menuPriceCents != null)),
    [],
  );
  const [serviceKey, setServiceKey] = useState(bookable[0]?.key ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const selected = bookable.find((service) => service.key === serviceKey) ?? bookable[0];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const payload = await requestJson<{ appointment: { confirmationCode: string | null } }>(
        "/api/experiences/appointments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceKey,
            appointmentOn: form.get("appointmentOn"),
            startsAtLabel: form.get("startsAtLabel"),
            clientName: form.get("clientName"),
            clientEmail: form.get("clientEmail"),
            clientPhone: form.get("clientPhone"),
            notes: form.get("notes"),
            preferences: form.get("preferences"),
            therapistLabel: form.get("therapistLabel"),
            staffNotes: form.get("staffNotes"),
          }),
        },
        "We couldn’t book that appointment. Check the time and try again.",
      );
      setOk(`Booked ${payload.appointment.confirmationCode ?? "appointment"}.`);
      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t book that appointment. Check the time and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/90 p-5">
      <div>
        <h2 className="font-display text-2xl text-slate-950">Book for a client</h2>
        <p className="mt-1 text-sm text-slate-600">Staff desk booking with overlap checks.</p>
      </div>

      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-800">{ok}</p> : null}

      <div>
        <Label htmlFor="staff-service">Service</Label>
        <select
          id="staff-service"
          value={serviceKey}
          onChange={(event) => setServiceKey(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
        >
          {bookable.map((service) => (
            <option key={service.key} value={service.key}>
              {service.title} · {formatMenuPrice(service.menuPriceCents)} · {formatDuration(service.durationMinutes)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="staff-date">Date</Label>
          <Input id="staff-date" name="appointmentOn" type="date" required />
        </div>
        <div>
          <Label htmlFor="staff-time">Time</Label>
          <select
            id="staff-time"
            name="startsAtLabel"
            required
            defaultValue={APPOINTMENT_TIME_OPTIONS[2]}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
          >
            {APPOINTMENT_TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="staff-name">Client name</Label>
          <Input id="staff-name" name="clientName" required />
        </div>
        <div>
          <Label htmlFor="staff-phone">Phone</Label>
          <Input id="staff-phone" name="clientPhone" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="staff-email">Email</Label>
          <Input id="staff-email" name="clientEmail" type="email" required />
        </div>
        <div>
          <Label htmlFor="staff-therapist">Therapist</Label>
          <Input id="staff-therapist" name="therapistLabel" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="staff-prefs">Preferences</Label>
          <Input id="staff-prefs" name="preferences" placeholder="Pressure, focus areas" />
        </div>
      </div>

      <div>
        <Label htmlFor="staff-notes">Client notes</Label>
        <Textarea id="staff-notes" name="notes" rows={2} />
      </div>
      <div>
        <Label htmlFor="staff-staff-notes">Staff notes</Label>
        <Textarea id="staff-staff-notes" name="staffNotes" rows={2} />
      </div>

      <Button type="submit" disabled={pending || !selected}>
        {pending ? "Booking…" : "Book appointment"}
      </Button>
    </form>
  );
}
