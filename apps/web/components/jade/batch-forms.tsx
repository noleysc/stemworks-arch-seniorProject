/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BATCH_SIZES } from "@/lib/product/catalog";

type MaterialOption = {
  id: string;
  name: string;
  unit: string;
  quantityOnHand: number;
};

type SkuOption = {
  id: string;
  code: string;
  name: string;
};

export function CreateBatchForm({
  skus,
  materials,
}: {
  skus: SkuOption[];
  materials: MaterialOption[];
}) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [skuId, setSkuId] = useState(skus[0]?.id ?? "");
  const [unitsPoured, setUnitsPoured] = useState(String(BATCH_SIZES[0]));
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMaterial = materials.find((row) => row.id === materialId);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!skuId || !materialId) {
      setError("Add a product SKU and a material with stock first.");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/jade/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId,
          unitsPoured,
          pouredOn: form.get("pouredOn"),
          notes: form.get("notes"),
          materials: [
            {
              materialId,
              quantityUsed: form.get("quantityUsed"),
            },
          ],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "The batch did not save.");
        return;
      }
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("The desk could not be reached.");
    } finally {
      setPending(false);
    }
  }

  if (skus.length === 0 || materials.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white p-5 text-sm text-emerald-950/70">
        {skus.length === 0
          ? "Add a finished product SKU before pouring a batch."
          : "Order materials (for example beeswax) and receive stock before pouring a batch."}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-emerald-900/10 bg-white p-5">
      <div>
        <h2 className="font-display text-2xl">Pour a batch</h2>
        <p className="mt-1 text-sm text-emerald-950/70">
          Step 2 — turn ordered materials into a tracked pour of 6 or 10 finished units.
        </p>
      </div>
      <Field label="Product SKU">
        <Select value={skuId} onValueChange={setSkuId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {skus.map((sku) => (
              <SelectItem key={sku.id} value={sku.id}>
                {sku.code} · {sku.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch size">
          <Select value={unitsPoured} onValueChange={setUnitsPoured}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BATCH_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} units
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Poured on">
          <Input name="pouredOn" type="date" defaultValue={today} required />
        </Field>
      </div>
      <Field label="Material from stock">
        <Select value={materialId} onValueChange={setMaterialId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.name} · {material.quantityOnHand} {material.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={`Quantity used (${selectedMaterial?.unit ?? "units"})`}>
        <Input name="quantityUsed" type="number" min={1} defaultValue={1} required />
      </Field>
      <Field label="Notes">
        <Input name="notes" placeholder="Optional pour notes" />
      </Field>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Pouring…" : "Create batch"}
      </Button>
    </form>
  );
}

export function ReleaseBatchButton({
  batchId,
  unitsPoured,
}: {
  batchId: string;
  unitsPoured: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRelease() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/jade/batches/${batchId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitsPassedQc: unitsPoured, defectReason: "" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "Release failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("The desk could not be reached.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" onClick={() => void onRelease()} disabled={pending}>
        {pending ? "Releasing…" : "Release to inventory"}
      </Button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function RecallBatchForm({ batchId, batchCode }: { batchId: string; batchCode: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/jade/batches/${batchId}/recall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: form.get("reason") }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "Recall failed.");
        return;
      }
      setMessage(typeof payload.message === "string" ? payload.message : `Batch ${batchCode} recalled.`);
      router.refresh();
    } catch {
      setError("The desk could not be reached.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-2 rounded-xl border border-amber-800/20 bg-amber-50/60 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-900/70">Recall tracking</p>
      <p className="text-sm text-emerald-950/70">
        Pull remaining finished stock from {batchCode}. Materials and SKU lineage stay linked under this code.
      </p>
      <Field label="Reason">
        <Input name="reason" required placeholder="Contamination / wick defect / customer report" />
      </Field>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-900">{message}</p> : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Recalling…" : "Recall this batch"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
