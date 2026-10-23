/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const tokenClass: Record<string, string> = {
  rooms: "bg-stone-950",
  dining: "bg-amber-800",
  gatherings: "bg-stone-400",
  jade: "bg-emerald-800",
  experiences: "bg-teal-800",
  haven: "bg-stone-600",
  stemworks: "bg-stone-800",
};

export function DashboardBoard({
  tenantKey,
  ventureOptions,
}: {
  tenantKey: string;
  ventureOptions: { key: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venture = searchParams.get("venture") ?? "";
  const horizon = searchParams.get("horizon") === "12m" ? "12m" : "90d";
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  async function load() {
    setPending(true);
    setError(null);
    const query = new URLSearchParams({ tenant: tenantKey });
    if (venture) query.set("venture", venture);
    if (horizon === "12m") query.set("horizon", "12m");
    try {
      const response = await fetch(`/api/v1/dashboard?${query.toString()}`);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setPayload(null);
        setError(typeof body?.error === "string" ? body.error : "The board could not be loaded.");
        return;
      }
      setPayload(body as DashboardPayload);
    } catch {
      setPayload(null);
      setError("The board could not be loaded.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantKey, venture, horizon]);

  function setQuery(next: { venture?: string; horizon?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tenant", tenantKey);
    if ("venture" in next) {
      if (next.venture) params.set("venture", next.venture);
      else params.delete("venture");
    }
    if ("horizon" in next) {
      if (next.horizon === "12m") params.set("horizon", "12m");
      else params.delete("horizon");
    }
    router.replace(`?${params.toString()}`);
  }

  if (pending && !payload) {
    return <p className="text-sm text-stone-500">Loading the board.</p>;
  }

  if (error && !payload) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-700">{error}</p>
        <Button className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!payload) return null;

  const gap = payload.header.potentialCents - payload.header.confirmedCents;
  const countdown = payload.header.nextMilestone
    ? countdownLabel(payload.businessDate, payload.header.nextMilestone.dueOn)
    : null;

  return (
    <div className="space-y-6">
      <header className="sticky top-[4.5rem] z-10 space-y-4 border-b border-stone-200 bg-stone-50/95 pb-4 backdrop-blur md:top-16">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{payload.tenant.name}</p>
            <h1 className="mt-1 font-display text-4xl text-stone-950">Command board</h1>
            <p className="mt-2 text-sm text-stone-600">
              Business date {payload.businessDate} · {payload.timezone}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!venture} onClick={() => setQuery({ venture: "" })}>
              All ventures
            </FilterChip>
            {ventureOptions.map((item) => (
              <FilterChip
                key={item.key}
                active={venture === item.key}
                onClick={() => setQuery({ venture: item.key })}
              >
                {item.name}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Confirmed" value={formatMoney(payload.header.confirmedCents)} />
          <Metric label="Potential" value={formatMoney(payload.header.potentialCents)} />
          <Metric label="Gap" value={formatMoney(gap)} detail="execution target" />
        </div>

        <div className="flex flex-col gap-2 text-sm text-stone-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {payload.header.nextMilestone ? (
              <>
                Next: <span className="font-medium text-stone-950">{payload.header.nextMilestone.title}</span>
                {countdown ? <span className="text-stone-500"> · {countdown}</span> : null}
              </>
            ) : (
              "No open milestone in this view."
            )}
          </p>
          {payload.header.topAlert ? <p className="text-amber-900">{payload.header.topAlert.body}</p> : null}
        </div>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-display text-2xl">Attention</h2>
        {payload.attention.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Nothing due in the next 3 days.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {payload.attention.map((item, index) => (
              <li key={`${item.body}-${index}`} className="text-sm text-stone-700">
                {item.body}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {payload.ventures.map((card) => (
          <article
            key={card.key}
            className={cn(
              "rounded-2xl border border-stone-200 bg-white p-5",
              !card.expanded && "opacity-90",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", tokenClass[card.colorToken] ?? "bg-stone-500")} />
                  <h3 className="font-display text-2xl text-stone-950">{card.name}</h3>
                </div>
                <p className="mt-1 text-sm text-stone-500">{card.statusLabel}</p>
              </div>
              <Link href={card.detailHref} className="text-sm underline underline-offset-4">
                Open
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-stone-500">Confirmed</p>
                <p className="font-medium">{formatMoney(card.confirmedCents)}</p>
              </div>
              <div>
                <p className="text-stone-500">Potential</p>
                <p className="font-medium">{formatMoney(card.potentialCents)}</p>
              </div>
            </div>
            {card.openCount > 0 && card.confirmedCents === 0 && card.potentialCents === 0 ? (
              <p className="mt-3 text-sm text-stone-600">Open stays have no amount yet.</p>
            ) : null}
            {card.topItems.length === 0 ? (
              <p className="mt-4 text-sm text-stone-600">No deals in motion.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {card.topItems.map((item) => (
                  <li key={`${item.label}-${item.kind}`} className="flex justify-between gap-3 text-sm">
                    <span>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-stone-500"> · {item.stage}</span>
                    </span>
                    <span>{formatMoney(item.valueCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl">Timeline</h2>
          <div className="flex gap-2">
            <FilterChip active={horizon === "90d"} onClick={() => setQuery({ horizon: "90d" })}>
              90 days
            </FilterChip>
            <FilterChip active={horizon === "12m"} onClick={() => setQuery({ horizon: "12m" })}>
              12 months
            </FilterChip>
          </div>
        </div>
        {payload.milestones.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">No open milestones in this horizon.</p>
        ) : (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {payload.milestones.map((item) => (
              <div key={item.id} className="min-w-[220px] rounded-xl border border-stone-200 p-3">
                <span className={cn("mb-2 inline-block h-1.5 w-10 rounded-full", tokenClass[item.colorToken] ?? "bg-stone-500")} />
                <p className="text-sm font-medium text-stone-950">{item.title}</p>
                <p className="mt-1 text-xs text-stone-500">{item.dueOn}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {detail ? <p className="text-sm text-stone-500">{detail}</p> : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm",
        active ? "bg-stone-950 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200",
      )}
    >
      {children}
    </button>
  );
}

function countdownLabel(businessDate: string, dueOn: string) {
  const start = Date.parse(`${businessDate}T00:00:00Z`);
  const end = Date.parse(`${dueOn}T00:00:00Z`);
  const delta = Math.round((end - start) / 86_400_000);
  if (delta <= 0) return "Today";
  if (delta === 1) return "Tomorrow";
  return `In ${delta} days`;
}
