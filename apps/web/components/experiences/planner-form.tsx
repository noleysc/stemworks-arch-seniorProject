/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { SpaMenuPicker } from "@/components/experiences/spa-menu-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_EVENT_LOCATION, DEFAULT_HOST_NAME } from "@/lib/experiences/catalog";
import { formatDuration, formatMenuPrice, THROUGHOUT_LABEL, type SpaService } from "@/lib/experiences/spa-menu";

type DraftItem = {
  localId: string;
  serviceKey?: string;
  startsAtLabel: string;
  title: string;
  detail: string;
  placeLabel?: string;
  emoji?: string;
  durationMinutes?: number | null;
  menuPriceCents?: number | null;
};

type DraftTier = {
  localId: string;
  label: string;
  description: string;
  price: string;
  quantityAvailable: string;
};

type DraftVendor = {
  localId: string;
  displayName: string;
  roleLabel: string;
};

let seq = 0;
function nid(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function PlannerForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [itinerary, setItinerary] = useState<DraftItem[]>([]);
  const [tiers, setTiers] = useState<DraftTier[]>([
    {
      localId: nid("tier"),
      label: "General admission",
      description: "Evening access",
      price: "65",
      quantityAvailable: "40",
    },
  ]);
  const [vendors, setVendors] = useState<DraftVendor[]>([]);

  const selectedKeys = useMemo(
    () => itinerary.map((item) => item.serviceKey).filter((key): key is string => Boolean(key)),
    [itinerary],
  );

  function addService(service: SpaService) {
    setItinerary((current) => {
      if (current.some((item) => item.serviceKey === service.key)) return current;
      return [
        ...current,
        {
          localId: nid("svc"),
          serviceKey: service.key,
          startsAtLabel: THROUGHOUT_LABEL,
          title: service.title,
          detail: service.detail,
          placeLabel: service.placeLabel,
          emoji: service.emoji,
          durationMinutes: service.durationMinutes,
          menuPriceCents: service.menuPriceCents,
        },
      ];
    });
  }

  function addCustomMoment() {
    const title = customTitle.trim();
    if (!title) return;
    setItinerary((current) => [
      ...current,
      {
        localId: nid("moment"),
        startsAtLabel: customTime.trim() || THROUGHOUT_LABEL,
        title,
        detail: "",
      },
    ]);
    setCustomTitle("");
    setCustomTime("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/experiences/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          summary: form.get("summary"),
          location: form.get("location"),
          startsOn: form.get("startsOn"),
          startsAtLabel: form.get("startsAtLabel"),
          capacity: form.get("capacity"),
          hostDisplayName: form.get("hostDisplayName"),
          publish: form.get("publish") === "on",
          itinerary: itinerary.map((item) => ({
            serviceKey: item.serviceKey ?? "",
            startsAtLabel: item.startsAtLabel,
            title: item.title,
            detail: item.detail,
            placeLabel: item.placeLabel ?? "",
            emoji: item.emoji ?? "",
          })),
          tiers: tiers.map((tier) => ({
            label: tier.label,
            description: tier.description,
            price: tier.price,
            quantityAvailable: tier.quantityAvailable,
          })),
          vendors: vendors
            .filter((vendor) => vendor.displayName.trim())
            .map((vendor) => ({
              displayName: vendor.displayName,
              roleLabel: vendor.roleLabel,
            })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "The event did not save.");
      }
      router.push(`/experiences/${payload.event.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The event did not save.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Owner desk</p>
            <h2 className="mt-1 font-display text-2xl">Invite copy</h2>
          </div>
          <Field label="Event title" htmlFor="title">
            <Input id="title" name="title" required maxLength={160} placeholder="Holiday spa evening" />
          </Field>
          <Field label="What is this night?" htmlFor="summary">
            <Textarea
              id="summary"
              name="summary"
              required
              maxLength={800}
              placeholder="A ticketed evening at The Pampered Soul. Treatments you add from the menu appear on the invite."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="startsOn">
              <Input id="startsOn" name="startsOn" type="date" required />
            </Field>
            <Field label="Start time" htmlFor="startsAtLabel">
              <Input id="startsAtLabel" name="startsAtLabel" required placeholder="5:00 PM" />
            </Field>
          </div>
          <Field label="Location" htmlFor="location">
            <Input id="location" name="location" required defaultValue={DEFAULT_EVENT_LOCATION} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Capacity" htmlFor="capacity">
              <Input id="capacity" name="capacity" type="number" min={1} max={5000} defaultValue={24} required />
            </Field>
            <Field label="Host name on the invite" htmlFor="hostDisplayName">
              <Input id="hostDisplayName" name="hostDisplayName" defaultValue={DEFAULT_HOST_NAME} required />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <h2 className="font-display text-2xl">Tickets</h2>
          <ul className="space-y-3">
            {tiers.map((tier, index) => (
              <li key={tier.localId} className="grid gap-3 rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-3 sm:grid-cols-2">
                <Input
                  value={tier.label}
                  onChange={(event) =>
                    setTiers((current) =>
                      current.map((row) => (row.localId === tier.localId ? { ...row, label: event.target.value } : row)),
                    )
                  }
                  placeholder="General admission"
                />
                <Input
                  value={tier.price}
                  onChange={(event) =>
                    setTiers((current) =>
                      current.map((row) => (row.localId === tier.localId ? { ...row, price: event.target.value } : row)),
                    )
                  }
                  placeholder="Price"
                />
                <Input
                  value={tier.description}
                  onChange={(event) =>
                    setTiers((current) =>
                      current.map((row) =>
                        row.localId === tier.localId ? { ...row, description: event.target.value } : row,
                      ),
                    )
                  }
                  placeholder="What this ticket includes"
                />
                <Input
                  value={tier.quantityAvailable}
                  onChange={(event) =>
                    setTiers((current) =>
                      current.map((row) =>
                        row.localId === tier.localId ? { ...row, quantityAvailable: event.target.value } : row,
                      ),
                    )
                  }
                  placeholder="Quantity"
                />
                {tiers.length > 1 ? (
                  <button
                    type="button"
                    className="text-left text-sm text-slate-600 underline"
                    onClick={() => setTiers((current) => current.filter((row) => row.localId !== tier.localId))}
                  >
                    Remove {index === 0 ? "this ticket" : tier.label || "ticket"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setTiers((current) => [
                ...current,
                { localId: nid("tier"), label: "VIP", description: "", price: "125", quantityAvailable: "8" },
              ])
            }
          >
            Add ticket type
          </Button>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <div>
            <h2 className="font-display text-2xl">Other businesses</h2>
            <p className="mt-1 text-sm text-slate-600">
              Optional. Each name becomes a marketing-consent checkbox. The Pampered Soul is already the host.
            </p>
          </div>
          <ul className="space-y-3">
            {vendors.map((vendor) => (
              <li key={vendor.localId} className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={vendor.displayName}
                  onChange={(event) =>
                    setVendors((current) =>
                      current.map((row) =>
                        row.localId === vendor.localId ? { ...row, displayName: event.target.value } : row,
                      ),
                    )
                  }
                  placeholder="Business name"
                />
                <Input
                  value={vendor.roleLabel}
                  onChange={(event) =>
                    setVendors((current) =>
                      current.map((row) =>
                        row.localId === vendor.localId ? { ...row, roleLabel: event.target.value } : row,
                      ),
                    )
                  }
                  placeholder="Role, e.g. Florals"
                />
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVendors((current) => [...current, { localId: nid("vendor"), displayName: "", roleLabel: "Vendor" }])
            }
          >
            Add a business
          </Button>
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <div>
            <h2 className="font-display text-2xl">On this event</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pick massages and facials from the spa menu. Guests see only what you add here.
            </p>
          </div>
          {itinerary.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-900/15 px-4 py-6 text-sm text-slate-600">
              No treatments yet. Add from the menu below, or type a custom moment such as welcome or toast.
            </p>
          ) : (
            <ol className="space-y-3">
              {itinerary.map((item) => (
                <li key={item.localId} className="rounded-2xl border border-slate-900/10 bg-[#eef2f6] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.emoji ? `${item.emoji} ` : ""}
                        {item.title}
                      </p>
                      <p className="text-sm text-slate-600">
                        {[
                          formatDuration(item.durationMinutes ?? null),
                          item.serviceKey ? formatMenuPrice(item.menuPriceCents ?? null) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-slate-600 underline"
                      onClick={() => setItinerary((current) => current.filter((row) => row.localId !== item.localId))}
                    >
                      Remove
                    </button>
                  </div>
                  <Label className="mt-3 block text-xs uppercase tracking-[0.16em] text-slate-500" htmlFor={`${item.localId}-time`}>
                    Time on the invite
                  </Label>
                  <Input
                    id={`${item.localId}-time`}
                    className="mt-1"
                    value={item.startsAtLabel}
                    onChange={(event) =>
                      setItinerary((current) =>
                        current.map((row) =>
                          row.localId === item.localId ? { ...row, startsAtLabel: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder={THROUGHOUT_LABEL}
                  />
                </li>
              ))}
            </ol>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
            <Input
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder="Custom moment, e.g. Welcome tea"
            />
            <Input value={customTime} onChange={(event) => setCustomTime(event.target.value)} placeholder="5:00 PM" />
            <Button type="button" variant="outline" onClick={addCustomMoment}>
              Add moment
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <h2 className="font-display text-2xl">Spa menu</h2>
          <p className="mt-1 mb-4 text-sm text-slate-600">
            The Pampered Soul treatments. Click one to put it on this event.
          </p>
          <SpaMenuPicker selectedKeys={selectedKeys} onAdd={addService} disabled={pending} />
        </section>

        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-900/10 bg-white/80 p-5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publish" className="h-4 w-4" />
            Publish the invite now
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save event"}
          </Button>
          {error ? <p className="w-full text-sm text-red-700">{error}</p> : null}
        </div>
      </div>
    </form>
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
