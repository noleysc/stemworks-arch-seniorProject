/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestErrorMessage, requestJson } from "@/lib/http";
import { APPOINTMENT_TIME_OPTIONS } from "@/lib/experiences/appointment-times";
import {
  formatDuration,
  formatMenuPrice,
  spaServicesByCategory,
  type SpaService,
} from "@/lib/experiences/spa-menu";

const TIME_OPTIONS = APPOINTMENT_TIME_OPTIONS;

const LOOP_ROTATE_MS = 7000;
const LOOP_RESET_MS = 12000;

export function ServiceBookForm({ loop = false }: { loop?: boolean }) {
  const groups = useMemo(() => spaServicesByCategory(), []);
  const bookable = useMemo(
    () => groups.flatMap((group) => group.services.filter((service) => service.menuPriceCents != null)),
    [groups],
  );
  const [serviceKey, setServiceKey] = useState(bookable[0]?.key ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pauseRotate, setPauseRotate] = useState(false);
  const [resetIn, setResetIn] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<{
    confirmationCode: string | null;
    serviceTitle: string;
    appointmentOn: string;
    startsAtLabel: string;
    paymentStatus?: string;
    paymentLast4?: string | null;
    paymentBrand?: string | null;
  } | null>(null);

  const selected = bookable.find((service) => service.key === serviceKey) ?? bookable[0];

  useEffect(() => {
    if (!loop || receipt || pauseRotate || bookable.length < 2) return;
    const timer = window.setInterval(() => {
      setServiceKey((current) => {
        const index = Math.max(0, bookable.findIndex((service) => service.key === current));
        return bookable[(index + 1) % bookable.length]?.key ?? current;
      });
    }, LOOP_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [loop, receipt, pauseRotate, bookable]);

  useEffect(() => {
    if (!loop || !receipt) {
      setResetIn(null);
      return;
    }
    const started = Date.now();
    setResetIn(Math.ceil(LOOP_RESET_MS / 1000));
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((LOOP_RESET_MS - (Date.now() - started)) / 1000));
      setResetIn(left);
      if (left <= 0) {
        setReceipt(null);
        setError(null);
        setPauseRotate(false);
        setResetIn(null);
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [loop, receipt]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError(null);
    setPauseRotate(true);
    try {
      const priceCents = selected?.menuPriceCents ?? 0;
      const payload = await requestJson<{
        appointment: NonNullable<typeof receipt> & {
          paymentStatus?: string;
          paymentLast4?: string | null;
          paymentBrand?: string | null;
        };
      }>(
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
            ...(priceCents > 0
              ? {
                  payment: {
                    cardholderName: form.get("cardholderName"),
                    cardNumber: form.get("cardNumber"),
                    expMonth: form.get("expMonth"),
                    expYear: form.get("expYear"),
                    cvc: form.get("cvc"),
                  },
                }
              : {}),
          }),
        },
        "We couldn’t confirm your appointment. Check your payment status or contact the spa before trying again.",
      );
      setReceipt({
        confirmationCode: payload.appointment.confirmationCode,
        serviceTitle: payload.appointment.serviceTitle,
        appointmentOn: payload.appointment.appointmentOn,
        startsAtLabel: payload.appointment.startsAtLabel,
        paymentStatus: payload.appointment.paymentStatus,
        paymentLast4: payload.appointment.paymentLast4,
        paymentBrand: payload.appointment.paymentBrand,
      });
      formElement.reset();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "We lost the connection while booking. Check your payment status or contact the spa before trying again."
          : requestErrorMessage(
              err,
              "We couldn’t confirm your appointment. Check your payment status or contact the spa before trying again.",
              true,
            ),
      );
      setPauseRotate(false);
    } finally {
      setPending(false);
    }
  }

  if (receipt) {
    return (
      <div className="rounded-[1.75rem] border border-slate-900/15 bg-white p-6 text-slate-950 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-700">Booked</p>
        <h2 className="mt-2 font-display text-3xl text-slate-950">You’re on the book</h2>
        <p className="mt-3 text-sm leading-6 text-slate-800">
          {receipt.serviceTitle} · {receipt.appointmentOn} · {receipt.startsAtLabel}
          {receipt.paymentStatus === "paid" && receipt.paymentLast4
            ? ` · charged ${receipt.paymentBrand ?? "card"} ···· ${receipt.paymentLast4}`
            : ""}
        </p>
        {receipt.confirmationCode ? (
          <p className="mt-4 font-mono text-lg font-semibold text-slate-950">{receipt.confirmationCode}</p>
        ) : null}
        {loop && resetIn != null ? (
          <p className="mt-4 text-sm font-medium text-slate-700">Next guest in {resetIn}s…</p>
        ) : (
          <Button type="button" className="mt-6" variant="outline" onClick={() => setReceipt(null)}>
            Book another service
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={() => setPauseRotate(true)}
      className="space-y-6 rounded-[1.75rem] border border-slate-900/10 bg-white p-5 text-slate-950 shadow-sm sm:p-6"
    >
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-slate-950">Choose a service</h2>
          {loop ? (
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700">
              {pauseRotate ? "Paused" : "Rotating"}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3">
          {groups.map((group) => (
            <div key={group.key} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">{group.label}</p>
              <ul className="grid gap-2">
                {group.services
                  .filter((service) => service.menuPriceCents != null)
                  .map((service) => (
                    <ServiceOption
                      key={service.key}
                      service={service}
                      selected={service.key === selected?.key}
                      onSelect={() => {
                        setServiceKey(service.key);
                        setPauseRotate(true);
                      }}
                    />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-900/10 bg-slate-50 p-5 sm:grid-cols-2">
        <Field label="Date" htmlFor="appointmentOn">
          <Input id="appointmentOn" name="appointmentOn" type="date" required className="bg-white text-slate-950" />
        </Field>
        <Field label="Time" htmlFor="startsAtLabel">
          <select
            id="startsAtLabel"
            name="startsAtLabel"
            required
            className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-slate-950"
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
          <Input id="clientName" name="clientName" required className="bg-white text-slate-950" />
        </Field>
        <Field label="Phone" htmlFor="clientPhone">
          <Input id="clientPhone" name="clientPhone" required className="bg-white text-slate-950" />
        </Field>
        <Field label="Email" htmlFor="clientEmail">
          <Input id="clientEmail" name="clientEmail" type="email" required className="bg-white text-slate-950 sm:col-span-2" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes (optional)" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              className="bg-white text-slate-950"
              placeholder="Pressure preference, focus areas…"
            />
          </Field>
        </div>
      </section>

      {selected && (selected.menuPriceCents ?? 0) > 0 ? (
        <section className="space-y-3 rounded-[1.5rem] border border-slate-900/10 bg-slate-50 p-5">
          <div>
            <h2 className="font-display text-xl text-slate-950">Pay now</h2>
            <p className="mt-1 text-sm text-slate-600">
              Card is charged when you book. Demo accepts Visa{" "}
              <span className="font-mono">4242 4242 4242 4242</span>.
            </p>
          </div>
          <Field label="Name on card" htmlFor="cardholderName">
            <Input id="cardholderName" name="cardholderName" required autoComplete="cc-name" className="bg-white" />
          </Field>
          <Field label="Card number" htmlFor="cardNumber">
            <Input
              id="cardNumber"
              name="cardNumber"
              required
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              className="bg-white"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Exp month" htmlFor="expMonth">
              <Input id="expMonth" name="expMonth" required inputMode="numeric" placeholder="12" className="bg-white" />
            </Field>
            <Field label="Exp year" htmlFor="expYear">
              <Input id="expYear" name="expYear" required inputMode="numeric" placeholder="2030" className="bg-white" />
            </Field>
            <Field label="CVC" htmlFor="cvc">
              <Input id="cvc" name="cvc" required inputMode="numeric" placeholder="123" autoComplete="cc-csc" className="bg-white" />
            </Field>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !selected}>
          {pending
            ? (selected?.menuPriceCents ?? 0) > 0
              ? "Charging card…"
              : "Booking…"
            : selected
              ? (selected.menuPriceCents ?? 0) > 0
                ? `Pay ${formatMenuPrice(selected.menuPriceCents)} · book`
                : "Book"
              : "Book"}
        </Button>
        {selected ? (
          <p className="text-sm font-medium text-slate-800">
            {[formatDuration(selected.durationMinutes), formatMenuPrice(selected.menuPriceCents)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {error ? <p role="alert" className="w-full text-sm font-medium text-red-800">{error}</p> : null}
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
        selected
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-900/15 bg-white text-slate-950 hover:border-slate-900/40"
      }`}
    >
      <p className={`font-semibold ${selected ? "text-white" : "text-slate-950"}`}>
        {service.emoji ? `${service.emoji} ` : ""}
        {service.title}
      </p>
      <p className={`mt-1 text-sm ${selected ? "text-slate-200" : "text-slate-700"}`}>
        {[formatDuration(service.durationMinutes), formatMenuPrice(service.menuPriceCents)].filter(Boolean).join(" · ")}
      </p>
      {selected && service.detail ? (
        <p className={`mt-2 text-sm leading-5 ${selected ? "text-slate-200" : "text-slate-700"}`}>{service.detail}</p>
      ) : null}
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
      <Label htmlFor={htmlFor} className="font-medium text-slate-800">
        {label}
      </Label>
      {children}
    </div>
  );
}
