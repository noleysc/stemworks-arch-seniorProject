/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { formatTicketPrice } from "@/lib/experiences/catalog";

type Vendor = {
  businessKey: string;
  displayName: string;
  roleLabel: string;
};

type Tier = {
  key: string;
  label: string;
  description: string;
  priceCents: number;
  remaining: number;
};

export function RsvpForm({
  slug,
  vendors,
  disclosureText,
  tiers,
}: {
  slug: string;
  vendors: Vendor[];
  disclosureText: string;
  tiers: Tier[];
}) {
  const router = useRouter();
  const available = tiers.filter((tier) => tier.remaining > 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    confirmationCode: string;
    amountPaidCents: number;
    ticketQuantity: number;
    tierLabel: string;
    paymentLast4?: string;
    paymentBrand?: string;
  } | null>(null);
  const [tierKey, setTierKey] = useState(available[0]?.key ?? tiers[0]?.key ?? "general");
  const [quantity, setQuantity] = useState(1);
  const [optIns, setOptIns] = useState<Record<string, boolean>>(
    Object.fromEntries(vendors.map((vendor) => [vendor.businessKey, false])),
  );

  const selected = useMemo(
    () => tiers.find((tier) => tier.key === tierKey) ?? tiers[0],
    [tierKey, tiers],
  );
  const totalCents = (selected?.priceCents ?? 0) * quantity;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/experiences/events/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: String(formData.get("fullName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          tierKey,
          ticketQuantity: quantity,
          notes: String(formData.get("notes") ?? ""),
          guestNote: String(formData.get("guestNote") ?? ""),
          showOnGuestWall: formData.get("showOnGuestWall") === "on",
          networkOptIn: formData.get("networkOptIn") === "on",
          vendorOptIns: optIns,
          ...(totalCents > 0
            ? {
                payment: {
                  cardholderName: String(formData.get("cardholderName") ?? ""),
                  cardNumber: String(formData.get("cardNumber") ?? ""),
                  expMonth: Number(formData.get("expMonth") ?? 0),
                  expYear: Number(formData.get("expYear") ?? 0),
                  cvc: String(formData.get("cvc") ?? ""),
                },
              }
            : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not get tickets.");
      setReceipt({
        confirmationCode: payload.confirmationCode,
        amountPaidCents: payload.amountPaidCents,
        ticketQuantity: payload.ticketQuantity,
        tierLabel: payload.tierLabel,
        paymentLast4: payload.paymentLast4 || undefined,
        paymentBrand: payload.paymentBrand || undefined,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The desk could not be reached.");
    } finally {
      setPending(false);
    }
  }

  if (receipt) {
    return (
      <div className="rounded-[1.75rem] border border-white/15 bg-white p-6 text-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">You are in</p>
        <h2 className="mt-2 font-display text-3xl">Tickets confirmed</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {receipt.ticketQuantity} × {receipt.tierLabel} · {formatTicketPrice(receipt.amountPaidCents)}
          {receipt.amountPaidCents === 0
            ? " · no payment required"
            : receipt.paymentLast4
              ? ` · charged ${receipt.paymentBrand ?? "card"} ···· ${receipt.paymentLast4}`
              : ""}
        </p>
        <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 font-mono text-sm tracking-wide">
          {receipt.confirmationCode}
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Marketing consent was saved only for the hosts you checked. Email and phone stay with the
          organizer for this event, and with opted-in businesses for marketing.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[1.75rem] border border-white/15 bg-white p-6 text-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Get tickets</p>
        <h2 className="mt-1 font-display text-3xl">Join the night</h2>
      </div>

      <div className="space-y-2">
        {tiers.map((tier) => {
          const soldOut = tier.remaining <= 0;
          const active = tier.key === tierKey;
          return (
            <button
              key={tier.key}
              type="button"
              disabled={soldOut}
              onClick={() => setTierKey(tier.key)}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50"
              } ${soldOut ? "opacity-45" : ""}`}
            >
              <span>
                <span className="block font-medium">{tier.label}</span>
                <span className={`block text-sm ${active ? "text-slate-300" : "text-slate-600"}`}>
                  {soldOut ? "Sold out" : tier.description}
                </span>
              </span>
              <span className="whitespace-nowrap font-medium">{formatTicketPrice(tier.priceCents)}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="fullName" required />
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Tickets</span>
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
          >
            {Array.from({ length: Math.min(8, selected?.remaining || 1) }, (_, index) => index + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" required autoComplete="tel" placeholder="239-555-0100" />
      </div>

      <Field label="A note for the wall (optional)" name="guestNote" placeholder="Saving my spot" />

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="showOnGuestWall" defaultChecked className="mt-1" />
        <span>Show me on the guest wall (first name only)</span>
      </label>

      {totalCents > 0 ? (
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-medium text-slate-900">Payment</legend>
          <p className="text-sm text-slate-600">
            Card is charged when you buy tickets. Demo mode accepts Visa test card{" "}
            <span className="font-mono">4242 4242 4242 4242</span>.
          </p>
          <Field label="Name on card" name="cardholderName" required autoComplete="cc-name" />
          <Field
            label="Card number"
            name="cardNumber"
            required
            autoComplete="cc-number"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Exp month" name="expMonth" required inputMode="numeric" placeholder="12" />
            <Field label="Exp year" name="expYear" required inputMode="numeric" placeholder="2030" />
            <Field label="CVC" name="cvc" required inputMode="numeric" placeholder="123" autoComplete="cc-csc" />
          </div>
        </fieldset>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          These tickets are free — no payment information needed.
        </div>
      )}

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-sm font-medium text-slate-900">Marketing consent</legend>
        <p className="text-sm leading-6 text-slate-600">{disclosureText}</p>
        {vendors.map((vendor) => (
          <label key={vendor.businessKey} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={optIns[vendor.businessKey] ?? false}
              onChange={(event) =>
                setOptIns((current) => ({ ...current, [vendor.businessKey]: event.target.checked }))
              }
            />
            <span>
              <span className="font-medium">Yes — {vendor.displayName} may market to me</span>
              <span className="text-slate-600"> · {vendor.roleLabel}</span>
            </span>
          </label>
        ))}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="networkOptIn" className="mt-1" />
          <span>Keep my preferences in the Stemworks guest network for future invites.</span>
        </label>
      </fieldset>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !selected || selected.remaining <= 0}
        className="w-full rounded-full bg-[linear-gradient(135deg,#0f172a,#334155)] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending
          ? totalCents > 0
            ? "Charging card…"
            : "Confirming…"
          : totalCents > 0
            ? `Pay ${formatTicketPrice(totalCents)} · get tickets`
            : "Get free tickets"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "tel" | "email";
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
      />
    </label>
  );
}
