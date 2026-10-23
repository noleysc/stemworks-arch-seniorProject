/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useState } from "react";
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
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from "@/lib/product/catalog";

export function MaterialForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("wax");
  const [unit, setUnit] = useState("lb");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/jade/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          category,
          unit,
          supplier: form.get("supplier"),
          supplierSku: form.get("supplierSku"),
          reorderPoint: form.get("reorderPoint"),
          leadTimeDays: form.get("leadTimeDays"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "The material did not save.");
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

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-emerald-900/10 bg-white p-5">
      <h2 className="font-display text-2xl">Add material</h2>
      <Field label="Name">
        <Input name="name" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_CATEGORIES.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Unit">
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_UNITS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Reorder point">
          <Input name="reorderPoint" type="number" min={0} defaultValue={0} required />
        </Field>
        <Field label="Lead time (days)">
          <Input name="leadTimeDays" type="number" min={0} defaultValue={7} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Supplier">
          <Input name="supplier" />
        </Field>
        <Field label="Supplier SKU">
          <Input name="supplierSku" />
        </Field>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving" : "Save material"}
      </Button>
    </form>
  );
}

export function PurchaseForm({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/jade/materials/${materialId}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivedOn: form.get("receivedOn"),
          quantityReceived: form.get("quantityReceived"),
          totalCost: form.get("totalCost"),
          supplierOrderRef: form.get("supplierOrderRef"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "The purchase did not save.");
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

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-2 border-t border-emerald-900/10 pt-3">
      <p className="text-xs uppercase tracking-[0.14em] text-emerald-900/50">Receive purchase</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input name="receivedOn" type="date" required />
        <Input name="quantityReceived" type="number" min={1} placeholder="Qty" required />
        <Input name="totalCost" placeholder="Total USD" required />
        <Input name="supplierOrderRef" placeholder="PO / ref" />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? "Posting" : "Post receipt"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
