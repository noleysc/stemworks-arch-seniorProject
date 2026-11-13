/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestErrorMessage, requestJson } from "@/lib/http";
import {
  formatDuration,
  formatMenuPrice,
  spaServicesByCategory,
  type SpaService,
} from "@/lib/experiences/spa-menu";

const TIME_OPTIONS = [
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
];

export function ServiceBookForm() {
  const groups = useMemo(() => spaServicesByCategory(), []);
  const bookable = useMemo(
    () => groups.flatMap((group) => group.services.filter((service) => service.menuPriceCents != null)),
    [groups],
  );
  const [serviceKey, setServiceKey] = useState(bookable[0]?.key ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    confirmationCode: string | null;
    serviceTitle: string;
    appointmentOn: string;
    startsAtLabel: string;
  } | null>(null);

  const selected = bookable.find((service) => service.key === serviceKey) ?? bookable[0];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError(null);
    try {
      const payload = await requestJson<{ appointment: NonNullable<typeof receipt> }>("/api/experiences/appointments", {
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
        }),
      }, "We couldn’t confirm your appointment. Check your bookings or contact the spa before trying again.");
      setReceipt({
        confirmationCode: payload.appointment.confirmationCode,
        serviceTitle: payload.appointment.serviceTitle,
        appointmentOn: payload.appointment.appointmentOn,
        startsAtLabel: payload.appointment.startsAtLabel,
      });
      formElement.reset();
    } catch (err) {
      setError(err instanceof TypeError
        ? "We lost the connection while booking. Check your bookings or contact the spa before trying again."
        : requestErrorMessage(err, "We couldn’t confirm your appointment. Check your bookings or contact the spa before trying again."));
    } finally {
      setPending(false);
    }
  }

  if (receipt) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-slate-100 backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-100/80">Booked</p>
        <h2 className="mt-2 font-display text-3xl text-white">You’re on the book</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {receipt.serviceTitle} · {receipt.appointmentOn} · {receipt.startsAtLabel}
        </p>
        {receipt.confirmationCode ? (
          <p className="mt-4 font-mono text-lg text-amber-100">{receipt.confirmationCode}</p>
        ) : null}
        <Button
          type="button"
          className="mt-6"
          variant="outline"
          onClick={() => setReceipt(null)}
        >
          Book another service
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-white">Choose a service</h2>
        <div className="grid gap-3">
          {groups.map((group) => (
            <div key={group.key} className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
              <ul className="grid gap-2">
                {group.services
                  .filter((service) => service.menuPriceCents != null)
                  .map((service) => (
                    <ServiceOption
                      key={service.key}
                      service={service}
                      selected={service.key === selected?.key}
                      onSelect={() => setServiceKey(service.key)}
                    />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
        <Field label="Date" htmlFor="appointmentOn">
          <Input id="appointmentOn" name="appointmentOn" type="date" required className="bg-white/90" />
        </Field>
        <Field label="Time" htmlFor="startsAtLabel">
          <select
            id="startsAtLabel"
            name="startsAtLabel"
            required
            className="flex h-10 w-full rounded-md border border-input bg-white/90 px-3 text-sm"
            defaultValue="10:00 AM"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your name" htmlFor="clientName">
          <Input id="clientName" name="clientName" required className="bg-white/90" />
        </Field>
        <Field label="Phone" htmlFor="clientPhone">
          <Input id="clientPhone" name="clientPhone" required className="bg-white/90" />
        </Field>
        <Field label="Email" htmlFor="clientEmail">
          <Input id="clientEmail" name="clientEmail" type="email" required className="bg-white/90 sm:col-span-2" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes (optional)" htmlFor="notes">
            <Textarea id="notes" name="notes" className="bg-white/90" placeholder="Pressure preference, focus areas…" />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !selected}>
          {pending ? "Booking…" : selected ? `Book · ${formatMenuPrice(selected.menuPriceCents)}` : "Book"}
        </Button>
        {selected ? (
          <p className="text-sm text-slate-300">
            {[formatDuration(selected.durationMinutes), formatMenuPrice(selected.menuPriceCents)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {error ? <p role="alert" className="w-full text-sm text-red-300">{error}</p> : null}
      </div>
    </form>
  );
}

function ServiceOption({
  service,
  selected,
  onSelect,
}: {
  service: SpaService;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        selected ? "border-amber-200/60 bg-amber-200/10" : "border-white/10 bg-black/20 hover:border-white/25"
      }`}
    >
      <p className="font-medium text-white">
        {service.emoji ? `${service.emoji} ` : ""}
        {service.title}
      </p>
      <p className="mt-1 text-sm text-slate-300">
        {[formatDuration(service.durationMinutes), formatMenuPrice(service.menuPriceCents)].filter(Boolean).join(" · ")}
      </p>
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-slate-200">
        {label}
      </Label>
      {children}
    </div>
  );
}
