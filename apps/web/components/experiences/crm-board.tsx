/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FOLLOW_UP_STATUSES } from "@/lib/experiences/catalog";
import type { CrmContactRecord } from "@/lib/experiences/crm";
import { requestErrorMessage, requestJson } from "@/lib/http";

export function CrmBoard({
  contacts,
  businessFilter,
}: {
  contacts: CrmContactRecord[];
  businessFilter: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokeEmail, setRevokeEmail] = useState("");
  const [revokeBusiness, setRevokeBusiness] = useState(businessFilter || "jade_haven");

  const businesses = useMemo(
    () => Array.from(new Set(contacts.map((contact) => contact.businessKey))).sort(),
    [contacts],
  );

  async function updateFollowUp(id: string, followUpStatus: string) {
    setPendingId(id);
    setError(null);
    try {
      await requestJson(`/api/experiences/crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpStatus }),
      }, "We couldn’t save the follow-up status. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t save the follow-up status. Please try again."));
    } finally {
      setPendingId(null);
    }
  }

  async function revoke() {
    setError(null);
    try {
      await requestJson("/api/experiences/consent/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestEmail: revokeEmail, businessKey: revokeBusiness }),
      }, "We couldn’t update those marketing preferences. Please try again.");
      setRevokeEmail("");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t update those marketing preferences. Please try again."));
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <div className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
        <h2 className="font-display text-2xl">Guest preference revoke</h2>
        <p className="mt-1 text-sm text-slate-600">
          Strips contact channels from that business CRM only. Attendance history can remain archived.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={revokeEmail}
            onChange={(event) => setRevokeEmail(event.target.value)}
            placeholder="guest@email.com"
            className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={revokeBusiness}
            onChange={(event) => setRevokeBusiness(event.target.value)}
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
          >
            {(businesses.length > 0 ? businesses : ["jade_haven", "jade_flowers", "charcuterie_co"]).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={revoke}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm text-[#eef2f6]"
          >
            Revoke
          </button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-slate-600">No authorized CRM contacts yet. Opt-ins arrive from RSVP.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-3xl border border-slate-900/10 bg-white/90">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{contact.fullName}</p>
                <p className="text-sm text-slate-600">
                  {contact.businessKey} · {contact.email ?? "no email"} · {contact.followUpLabel}
                </p>
                {contact.lastInteraction ? (
                  <p className="mt-1 text-sm text-slate-500">{contact.lastInteraction}</p>
                ) : null}
              </div>
              <select
                disabled={pendingId === contact.id}
                value={contact.followUpStatus}
                onChange={(event) => updateFollowUp(contact.id, event.target.value)}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              >
                {FOLLOW_UP_STATUSES.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
