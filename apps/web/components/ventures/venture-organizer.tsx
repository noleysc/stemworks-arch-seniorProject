/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  FEATURE_CATALOG,
  METRIC_CATALOG,
  VENTURE_TYPES,
  addMetric,
  removeMetric,
  reorderMetrics,
  toggleFeature,
  type FeatureKey,
  type MetricKey,
  type VentureBlueprint,
  type VentureType,
} from "@/lib/ventures/blueprint";
import { cn } from "@/lib/utils";

export function VentureOrganizer({ canCreate }: { canCreate: boolean }) {
  const [blueprints, setBlueprints] = useState<VentureBlueprint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragMetric, setDragMetric] = useState<MetricKey | null>(null);

  const selected = useMemo(
    () => blueprints.find((item) => item.id === selectedId) ?? null,
    [blueprints, selectedId],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/venture-blueprints");
      const body = (await response.json()) as { blueprints?: VentureBlueprint[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Could not load ventures.");
      const list = body.blueprints ?? [];
      setBlueprints(list);
      setSelectedId((current) => current ?? list[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ventures.");
    } finally {
      setLoading(false);
    }
  }

  async function save(id: string, patch: Partial<VentureBlueprint>) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/v1/venture-blueprints/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = (await response.json()) as { blueprint?: VentureBlueprint; error?: string };
    if (!response.ok) throw new Error(body.error || "Could not save.");
    const next = body.blueprint!;
    setBlueprints((list) => list.map((item) => (item.id === next.id ? next : item)));
    setMessage("Saved.");
  }

  async function createVenture() {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/v1/venture-blueprints", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Untitled venture",
        shortName: "Untitled",
        type: "product_brand",
        features: ["product"],
      }),
    });
    const body = (await response.json()) as { blueprint?: VentureBlueprint; error?: string };
    if (!response.ok) throw new Error(body.error || "Could not create venture.");
    const next = body.blueprint!;
    setBlueprints((list) => [...list, next]);
    setSelectedId(next.id);
    setMessage("Venture created — arrange metrics and features.");
  }

  function applyLocal(patch: Partial<VentureBlueprint>) {
    if (!selected) return;
    setBlueprints((list) =>
      list.map((item) => (item.id === selected.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)),
    );
  }

  function onDropReorder(targetKey: MetricKey) {
    if (!selected || !dragMetric || dragMetric === targetKey) return;
    const fromIndex = selected.metricOrder.indexOf(dragMetric);
    const toIndex = selected.metricOrder.indexOf(targetKey);
    if (fromIndex < 0 || toIndex < 0) return;
    const metricOrder = reorderMetrics(selected.metricOrder, fromIndex, toIndex);
    applyLocal({ metricOrder });
    startTransition(() => {
      void save(selected.id, { metricOrder }).catch((err) => {
        setError(err instanceof Error ? err.message : "Could not save metrics.");
      });
    });
    setDragMetric(null);
  }

  const unusedMetrics = METRIC_CATALOG.filter((item) => !selected?.metricOrder.includes(item.key));

  if (loading) {
    return <p className="text-sm text-stone-600">Loading venture organizer…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Owner · Organize</p>
          <h1 className="mt-1 font-display text-4xl text-stone-950">Venture builder</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Create and shape each business: drag metrics into the board order you want, then check the features that
            desk should run.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(() => {
                void createVenture().catch((err) => {
                  setError(err instanceof Error ? err.message : "Could not create.");
                });
              });
            }}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            New venture
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">Ventures</p>
          {blueprints.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "w-full rounded-2xl border px-3 py-3 text-left transition",
                item.id === selectedId
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-900/10 bg-white/90 text-stone-800 hover:border-stone-900/30",
              )}
            >
              <span className="block font-medium">{item.shortName}</span>
              <span className={cn("mt-1 block text-xs", item.id === selectedId ? "text-stone-300" : "text-stone-500")}>
                {item.type.replaceAll("_", " ")}
              </span>
            </button>
          ))}
        </aside>

        {selected ? (
          <div className="space-y-8 rounded-3xl border border-stone-900/10 bg-white/90 p-5 sm:p-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                  value={selected.name}
                  onChange={(event) => applyLocal({ name: event.target.value })}
                  onBlur={() => {
                    void save(selected.id, { name: selected.name }).catch((err) => {
                      setError(err instanceof Error ? err.message : "Could not save name.");
                    });
                  }}
                />
              </Field>
              <Field label="Short name">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                  value={selected.shortName}
                  onChange={(event) => applyLocal({ shortName: event.target.value })}
                  onBlur={() => {
                    void save(selected.id, { shortName: selected.shortName }).catch((err) => {
                      setError(err instanceof Error ? err.message : "Could not save short name.");
                    });
                  }}
                />
              </Field>
              <Field label="Type">
                <select
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                  value={selected.type}
                  onChange={(event) => {
                    const type = event.target.value as VentureType;
                    applyLocal({ type });
                    void save(selected.id, { type }).catch((err) => {
                      setError(err instanceof Error ? err.message : "Could not save type.");
                    });
                  }}
                >
                  {VENTURE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status label">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                  value={selected.statusLabel}
                  onChange={(event) => applyLocal({ statusLabel: event.target.value })}
                  onBlur={() => {
                    void save(selected.id, { statusLabel: selected.statusLabel }).catch((err) => {
                      setError(err instanceof Error ? err.message : "Could not save status.");
                    });
                  }}
                />
              </Field>
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="font-display text-2xl text-stone-950">Board metrics</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Drag to reorder. These define how this venture’s command board reads.
                </p>
              </div>
              <ul className="space-y-2">
                {selected.metricOrder.map((key, index) => {
                  const meta = METRIC_CATALOG.find((item) => item.key === key)!;
                  return (
                    <li
                      key={key}
                      draggable
                      onDragStart={() => setDragMetric(key)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onDropReorder(key)}
                      className={cn(
                        "flex cursor-grab items-start justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-3 active:cursor-grabbing",
                        dragMetric === key && "opacity-60",
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-950">
                          <span className="mr-2 text-stone-400">{index + 1}</span>
                          {meta.label}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">{meta.description}</p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs text-stone-500 underline underline-offset-2"
                        onClick={() => {
                          const metricOrder = removeMetric(selected.metricOrder, key);
                          applyLocal({ metricOrder });
                          void save(selected.id, { metricOrder }).catch((err) => {
                            setError(err instanceof Error ? err.message : "Could not remove metric.");
                          });
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
              {unusedMetrics.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {unusedMetrics.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="rounded-full border border-dashed border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 hover:border-stone-500"
                      onClick={() => {
                        const metricOrder = addMetric(selected.metricOrder, item.key);
                        applyLocal({ metricOrder });
                        void save(selected.id, { metricOrder }).catch((err) => {
                          setError(err instanceof Error ? err.message : "Could not add metric.");
                        });
                      }}
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="font-display text-2xl text-stone-950">Features</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Check what this venture should run. Unchecked modules stay off that desk.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {FEATURE_CATALOG.map((item) => {
                  const checked = selected.features.includes(item.key);
                  return (
                    <label
                      key={item.key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition",
                        checked ? "border-stone-900/30 bg-stone-50" : "border-stone-200 bg-white",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-stone-300"
                        checked={checked}
                        onChange={(event) => {
                          const features = toggleFeature(
                            selected.features,
                            item.key as FeatureKey,
                            event.target.checked,
                          );
                          applyLocal({ features });
                          void save(selected.id, { features }).catch((err) => {
                            setError(err instanceof Error ? err.message : "Could not save features.");
                          });
                        }}
                      />
                      <span>
                        <span className="block text-sm font-medium text-stone-950">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-stone-500">{item.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-sm text-stone-600">
            No ventures yet. Create one to start organizing.
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">{label}</span>
      {children}
    </label>
  );
}
