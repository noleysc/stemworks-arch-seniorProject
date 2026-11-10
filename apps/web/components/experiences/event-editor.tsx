/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SpaMenuPicker } from "@/components/experiences/spa-menu-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExperienceEventRecord } from "@/lib/experiences/events";
import { formatDuration, formatMenuPrice, THROUGHOUT_LABEL, type SpaService } from "@/lib/experiences/spa-menu";

export function EventEditor({ event }: { event: ExperienceEventRecord }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customTime, setCustomTime] = useState("");

  const selectedKeys = useMemo(
    () => event.itinerary.map((item) => item.serviceKey).filter((key): key is string => Boolean(key)),
    [event.itinerary],
  );

  async function addService(service: SpaService, startsAtLabel = THROUGHOUT_LABEL) {
    setPendingKey(service.key);
    setError(null);
    try {
      const response = await fetch(`/api/experiences/events/${event.slug}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceKey: service.key, startsAtLabel }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not add that treatment.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that treatment.");
    } finally {
      setPendingKey(null);
    }
  }

  async function addMoment() {
    const title = customTitle.trim();
    if (!title) return;
    setPendingKey("moment");
    setError(null);
    try {
      const response = await fetch(`/api/experiences/events/${event.slug}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startsAtLabel: customTime.trim() || THROUGHOUT_LABEL,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not add that moment.");
      }
      setCustomTitle("");
      setCustomTime("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that moment.");
    } finally {
      setPendingKey(null);
    }
  }

  async function removeItem(id: string) {
    setPendingKey(id);
    setError(null);
    try {
      const response = await fetch(`/api/experiences/events/${event.slug}/itinerary/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not remove that item.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that item.");
    } finally {
      setPendingKey(null);
    }
  }

  async function publish() {
    setPendingKey("publish");
    setError(null);
    try {
      const response = await fetch(`/api/experiences/events/${event.slug}/publish`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not publish.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Owner desk · {event.statusLabel}</p>
            <h2 className="mt-1 font-display text-2xl">Treatments on this event</h2>
          </div>
          {event.status === "open" || event.status === "full" ? (
            <Link className="text-sm underline" href={`/e/${event.slug}`} target="_blank">
              Open guest invite
            </Link>
          ) : (
            <span className="text-sm text-slate-500">Publish to share the guest invite</span>
          )}
        </div>
        {event.itinerary.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing on the invite yet. Add a massage or facial from the menu.</p>
        ) : (
          <ol className="space-y-3">
            {event.itinerary.map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.startsAtLabel}</p>
                    <p className="mt-1 font-medium">
                      {item.emoji ? `${item.emoji} ` : ""}
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-600">
                      {[formatDuration(item.durationMinutes), item.serviceKey ? formatMenuPrice(item.menuPriceCents) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-slate-600 underline"
                    disabled={pendingKey === item.id}
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            value={customTitle}
            onChange={(event) => setCustomTitle(event.target.value)}
            placeholder="Custom moment"
          />
          <Input value={customTime} onChange={(event) => setCustomTime(event.target.value)} placeholder="6:00 PM" />
          <Button type="button" variant="outline" disabled={pendingKey === "moment"} onClick={addMoment}>
            Add moment
          </Button>
        </div>
        {event.status === "draft" ? (
          <Button type="button" disabled={pendingKey === "publish"} onClick={publish}>
            Publish guest invite
          </Button>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-5">
        <h2 className="font-display text-2xl">Spa menu</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">Add another Pampered Soul treatment to this event.</p>
        <SpaMenuPicker selectedKeys={selectedKeys} onAdd={addService} disabled={Boolean(pendingKey)} />
      </section>
    </div>
  );
}
