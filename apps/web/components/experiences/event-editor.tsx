/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SpaMenuPicker } from "@/components/experiences/spa-menu-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExperienceEventRecord } from "@/lib/experiences/events";
import { requestErrorMessage, requestJson } from "@/lib/http";
import { formatTicketPrice } from "@/lib/experiences/catalog";
import { formatDuration, formatMenuPrice, THROUGHOUT_LABEL, type SpaService } from "@/lib/experiences/spa-menu";

type DraftTier = {
  localId: string;
  id?: string;
  label: string;
  description: string;
  price: string;
  quantityAvailable: string;
  sold: number;
};

let seq = 0;
function nid(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function EventEditor({ event }: { event: ExperienceEventRecord }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [title, setTitle] = useState(event.title);
  const [summary, setSummary] = useState(event.summary);
  const [startsOn, setStartsOn] = useState(event.startsOn);
  const [startsAtLabel, setStartsAtLabel] = useState(event.startsAtLabel ?? "");
  const [location, setLocation] = useState(event.location);
  const [capacity, setCapacity] = useState(String(event.capacity));
  const [hostDisplayName, setHostDisplayName] = useState(event.hostDisplayName);
  const [tiers, setTiers] = useState<DraftTier[]>(
    event.tiers.map((tier) => ({
      localId: tier.id,
      id: tier.id,
      label: tier.label,
      description: tier.description,
      price: centsToDollars(tier.priceCents),
      quantityAvailable: String(tier.quantityAvailable),
      sold: tier.quantitySold,
    })),
  );

  const selectedKeys = useMemo(
    () => event.itinerary.map((item) => item.serviceKey).filter((key): key is string => Boolean(key)),
    [event.itinerary],
  );
  const published = event.status === "open" || event.status === "full";
  const cancelled = event.status === "cancelled";

  async function addService(service: SpaService, startsAtLabelValue = THROUGHOUT_LABEL) {
    setPendingKey(service.key);
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceKey: service.key, startsAtLabel: startsAtLabelValue }),
      }, "We couldn’t add that treatment. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t add that treatment. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  async function addMoment() {
    const momentTitle = customTitle.trim();
    if (!momentTitle) return;
    setPendingKey("moment");
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: momentTitle,
          startsAtLabel: customTime.trim() || THROUGHOUT_LABEL,
        }),
      }, "We couldn’t add that itinerary item. Please try again.");
      setCustomTitle("");
      setCustomTime("");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t add that itinerary item. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  async function removeItem(id: string) {
    setPendingKey(id);
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}/itinerary/${id}`, { method: "DELETE" }, "We couldn’t remove that itinerary item. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t remove that itinerary item. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  async function saveDetails() {
    setPendingKey("save");
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          location,
          startsOn,
          startsAtLabel,
          capacity,
          hostDisplayName,
          tiers: tiers.map((tier) => ({
            id: tier.id,
            label: tier.label,
            description: tier.description,
            price: tier.price,
            quantityAvailable: tier.quantityAvailable,
          })),
        }),
      }, "We couldn’t save your invite changes. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t save your invite changes. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  async function publish() {
    setPendingKey("publish");
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}/publish`, { method: "POST" }, "We couldn’t publish your invite. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t publish your invite. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  async function unpublish() {
    setPendingKey("unpublish");
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}/unpublish`, { method: "POST" }, "We couldn’t unpublish your invite. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t unpublish your invite. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  async function cancelInvite() {
    if (!window.confirm("Cancel this invite? Guests will no longer be able to buy tickets.")) return;
    setPendingKey("cancel");
    setError(null);
    try {
      await requestJson(`/api/experiences/events/${event.slug}/cancel`, { method: "POST" }, "We couldn’t cancel your invite. Please try again.");
      router.refresh();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t cancel your invite. Please try again."));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/experiences/${event.slug}/preview`}
          className="rounded-full border border-slate-900/15 px-4 py-2 text-sm text-slate-900"
        >
          Preview guest invite
        </Link>
        {published ? (
          <Link
            href={`/e/${event.slug}`}
            className="rounded-full border border-slate-900/15 px-4 py-2 text-sm text-slate-900"
            target="_blank"
          >
            Open guest checkout
          </Link>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invite · {event.statusLabel}</p>
              <h2 className="mt-1 font-display text-2xl">Invite copy</h2>
            </div>
            <Field label="Title" htmlFor="edit-title">
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={cancelled} />
            </Field>
            <Field label="Summary" htmlFor="edit-summary">
              <Textarea
                id="edit-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={cancelled}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor="edit-date">
                <Input
                  id="edit-date"
                  type="date"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                  disabled={cancelled}
                />
              </Field>
              <Field label="Start time" htmlFor="edit-time">
                <Input
                  id="edit-time"
                  value={startsAtLabel}
                  onChange={(e) => setStartsAtLabel(e.target.value)}
                  disabled={cancelled}
                />
              </Field>
            </div>
            <Field label="Location" htmlFor="edit-location">
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={cancelled}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Capacity" htmlFor="edit-capacity">
                <Input
                  id="edit-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  disabled={cancelled}
                />
              </Field>
              <Field label="Host name" htmlFor="edit-host">
                <Input
                  id="edit-host"
                  value={hostDisplayName}
                  onChange={(e) => setHostDisplayName(e.target.value)}
                  disabled={cancelled}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
            <div>
              <h2 className="font-display text-2xl">Ticket types</h2>
              <p className="mt-1 text-sm text-slate-600">
                Quantity cannot drop below tickets already sold. Remove only unsold tiers.
              </p>
            </div>
            <ul className="space-y-3">
              {tiers.map((tier) => (
                <li key={tier.localId} className="grid gap-3 rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-3 sm:grid-cols-2">
                  <Input
                    value={tier.label}
                    disabled={cancelled}
                    onChange={(e) =>
                      setTiers((current) =>
                        current.map((row) => (row.localId === tier.localId ? { ...row, label: e.target.value } : row)),
                      )
                    }
                    placeholder="General admission"
                  />
                  <Input
                    value={tier.price}
                    disabled={cancelled}
                    onChange={(e) =>
                      setTiers((current) =>
                        current.map((row) => (row.localId === tier.localId ? { ...row, price: e.target.value } : row)),
                      )
                    }
                    placeholder="Price"
                  />
                  <Input
                    value={tier.description}
                    disabled={cancelled}
                    onChange={(e) =>
                      setTiers((current) =>
                        current.map((row) =>
                          row.localId === tier.localId ? { ...row, description: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="What this ticket includes"
                  />
                  <Input
                    value={tier.quantityAvailable}
                    disabled={cancelled}
                    onChange={(e) =>
                      setTiers((current) =>
                        current.map((row) =>
                          row.localId === tier.localId ? { ...row, quantityAvailable: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Quantity"
                  />
                  <p className="text-xs text-slate-600 sm:col-span-2">
                    {tier.sold > 0
                      ? `${tier.sold} sold · min quantity ${tier.sold} · ${formatTicketPrice(Math.round(Number(tier.price || 0) * 100) || 0)}`
                      : "No tickets sold yet"}
                  </p>
                  {tiers.length > 1 && tier.sold === 0 && !cancelled ? (
                    <button
                      type="button"
                      className="text-left text-sm text-slate-600 underline"
                      onClick={() => setTiers((current) => current.filter((row) => row.localId !== tier.localId))}
                    >
                      Remove ticket type
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {!cancelled ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setTiers((current) => [
                    ...current,
                    {
                      localId: nid("tier"),
                      label: "VIP",
                      description: "",
                      price: "125",
                      quantityAvailable: "8",
                      sold: 0,
                    },
                  ])
                }
              >
                Add ticket type
              </Button>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
            {!cancelled ? (
              <Button type="button" disabled={pendingKey === "save"} onClick={saveDetails}>
                {pendingKey === "save" ? "Saving…" : "Save invite details"}
              </Button>
            ) : null}
            {event.status === "draft" ? (
              <Button type="button" disabled={pendingKey === "publish"} onClick={publish}>
                Publish ticketed invite
              </Button>
            ) : null}
            {published ? (
              <Button type="button" variant="outline" disabled={pendingKey === "unpublish"} onClick={unpublish}>
                Unpublish
              </Button>
            ) : null}
            {!cancelled ? (
              <Button type="button" variant="outline" disabled={pendingKey === "cancel"} onClick={cancelInvite}>
                Cancel invite
              </Button>
            ) : (
              <p className="text-sm text-slate-600">This invite is cancelled.</p>
            )}
            {error ? <p role="alert" className="w-full text-sm text-red-700">{error}</p> : null}
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
            <div>
              <h2 className="font-display text-2xl">Treatments on this invite</h2>
              <p className="mt-1 text-sm text-slate-600">Spa menu and custom moments guests see on the invite.</p>
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
                      {!cancelled ? (
                        <button
                          type="button"
                          className="text-sm text-slate-600 underline"
                          disabled={pendingKey === item.id}
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {!cancelled ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Custom moment"
                />
                <Input value={customTime} onChange={(e) => setCustomTime(e.target.value)} placeholder="6:00 PM" />
                <Button type="button" variant="outline" disabled={pendingKey === "moment"} onClick={addMoment}>
                  Add moment
                </Button>
              </div>
            ) : null}
          </section>

          {!cancelled ? (
            <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-5">
              <h2 className="font-display text-2xl">Spa menu</h2>
              <p className="mt-1 mb-4 text-sm text-slate-600">Add another Pampered Soul treatment to this invite.</p>
              <SpaMenuPicker selectedKeys={selectedKeys} onAdd={addService} disabled={Boolean(pendingKey)} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
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
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
