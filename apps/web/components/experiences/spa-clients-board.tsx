/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  appointmentStatusLabel,
  type SpaClientRecord,
} from "@/lib/experiences/appointment-catalog";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { requestErrorMessage, requestJson } from "@/lib/http";

export function SpaClientsBoard({ clients }: { clients: SpaClientRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.fullName.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        (client.phone ?? "").includes(q),
    );
  }, [clients, query]);

  async function save(client: SpaClientRecord, form: FormData) {
    setPendingEmail(client.email);
    setError(null);
    try {
      await requestJson(
        "/api/experiences/clients",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: client.email,
            fullName: form.get("fullName"),
            phone: form.get("phone"),
            preferences: form.get("preferences"),
            spaNotes: form.get("spaNotes"),
          }),
        },
        "We couldn’t save those client details. Please try again.",
      );
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t save those client details. Please try again."));
    } finally {
      setPendingEmail(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, email, or phone"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600">No spa clients yet. Bookings create client files automatically.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((client) => {
            const open = expanded === client.email;
            return (
              <li key={client.email || client.id} className="rounded-3xl border border-slate-900/10 bg-white/90 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl text-slate-950">{client.fullName}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {client.email}
                      {client.phone ? ` · ${client.phone}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {client.appointmentCount} appointments
                      {client.lastAppointmentOn ? ` · last ${client.lastAppointmentOn}` : ""}
                    </p>
                    {client.preferences ? (
                      <p className="mt-2 text-sm text-slate-700">Preferences: {client.preferences}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded(open ? null : client.email)}
                  >
                    {open ? "Hide" : "Open file"}
                  </Button>
                </div>

                {open ? (
                  <div className="mt-4 space-y-4">
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        save(client, new FormData(event.currentTarget));
                      }}
                    >
                      <div>
                        <Label htmlFor={`name-${client.email}`}>Name</Label>
                        <Input id={`name-${client.email}`} name="fullName" defaultValue={client.fullName} required />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${client.email}`}>Phone</Label>
                        <Input id={`phone-${client.email}`} name="phone" defaultValue={client.phone ?? ""} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor={`prefs-${client.email}`}>Preferences</Label>
                        <Textarea
                          id={`prefs-${client.email}`}
                          name="preferences"
                          rows={2}
                          defaultValue={client.preferences ?? ""}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor={`notes-${client.email}`}>Staff spa notes</Label>
                        <Textarea
                          id={`notes-${client.email}`}
                          name="spaNotes"
                          rows={3}
                          defaultValue={client.spaNotes ?? ""}
                        />
                      </div>
                      <div>
                        <Button type="submit" disabled={pendingEmail === client.email}>
                          Save client file
                        </Button>
                      </div>
                    </form>

                    <div>
                      <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
                        Appointment history
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {client.appointments.map((appointment) => (
                          <li key={appointment.id} className="text-sm text-slate-700">
                            {appointment.appointmentOn} · {appointment.startsAtLabel} · {appointment.serviceTitle} ·{" "}
                            {appointmentStatusLabel(appointment.status)} · {formatTicketPrice(appointment.priceCents)}
                          </li>
                        ))}
                      </ul>
                    </div>
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
