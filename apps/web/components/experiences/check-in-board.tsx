/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { registrationStatusLabel } from "@/lib/experiences/catalog";
import { requestErrorMessage, requestJson } from "@/lib/http";

type GuestRow = {
  id: string;
  status: string;
  partySize: number;
  ticketQuantity?: number;
  amountPaidCents?: number;
  confirmationCode?: string | null;
  tierLabel?: string | null;
  checkedInAt: string | null;
  guest: { fullName: string; email: string };
  consents: { displayName: string; granted: boolean }[];
};

export function CheckInBoard({ registrations }: { registrations: GuestRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkIn(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await requestJson(`/api/experiences/registrations/${id}/check-in`, { method: "POST" }, "We couldn’t check in this guest. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t check in this guest. Please try again."));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {registrations.length === 0 ? (
        <p className="text-sm text-slate-600">No guests yet. Share the public RSVP link.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-3xl border border-slate-900/10 bg-white/90">
          {registrations.map((row) => {
            const opted = row.consents.filter((consent) => consent.granted).map((consent) => consent.displayName);
            return (
              <li key={row.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{row.guest.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {row.guest.email} · {row.tierLabel ?? "ticket"} × {row.ticketQuantity ?? row.partySize} ·{" "}
                    {registrationStatusLabel(row.status)}
                    {row.confirmationCode ? ` · ${row.confirmationCode}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Marketing consent: {opted.length > 0 ? opted.join(", ") : "none"}
                  </p>
                </div>
                {row.status === "attended" ? (
                  <span className="text-sm text-slate-500">Checked in</span>
                ) : row.status === "cancelled" ? (
                  <span className="text-sm text-slate-500">Cancelled</span>
                ) : (
                  <button
                    type="button"
                    disabled={pendingId === row.id}
                    onClick={() => checkIn(row.id)}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm text-[#eef2f6] disabled:opacity-60"
                  >
                    {pendingId === row.id ? "Saving…" : "Check in"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
