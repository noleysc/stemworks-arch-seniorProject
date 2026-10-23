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
import { ORDER_CHANNELS, ORDER_STATUSES, channelLabel, statusLabel } from "@/lib/product/catalog";
import { formatMoney } from "@/lib/money";
import type { OrderRecord } from "@/lib/product/orders";
import type { SkuRecord } from "@/lib/product/skus";

export function OrderPanel({ skus, orders }: { skus: SkuRecord[]; orders: OrderRecord[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState("direct");
  const [status, setStatus] = useState("pending");
  const [skuId, setSkuId] = useState(skus[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const selected = useMemo(() => skus.find((sku) => sku.id === skuId) ?? null, [skuId, skus]);
  const unitPrice = selected
    ? channel === "wholesale"
      ? selected.wholesaleCents
      : channel === "event"
        ? selected.eventCents
        : selected.retailCents
    : 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Add a SKU before taking an order.");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/jade/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          channel,
          status,
          notes: form.get("notes"),
          lines: [{ skuId: selected.id, quantity: Number(quantity), unitPriceCents: unitPrice }],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "The order did not save.");
        return;
      }
      event.currentTarget.reset();
      setQuantity("1");
      router.refresh();
    } catch {
      setError("The desk could not be reached.");
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(id: string, next: string) {
    setError(null);
    const response = await fetch(`/api/jade/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      setError("The status did not save.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-emerald-900/10 bg-white p-5 h-fit">
        <h2 className="font-display text-2xl">New order</h2>
        <Field label="Customer">
          <Input name="customerName" required />
        </Field>
        <Field label="Channel">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_CHANNELS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="SKU">
          <Select value={skuId} onValueChange={setSkuId} disabled={skus.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="No SKUs" />
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
          <Field label="Quantity">
            <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min={1} required />
          </Field>
          <Field label="Unit price">
            <Input value={(unitPrice / 100).toFixed(2)} readOnly />
          </Field>
        </div>
        <Field label="Notes">
          <Input name="notes" />
        </Field>
        <p className="text-sm text-emerald-900/60">
          Line total {formatMoney(unitPrice * (Number(quantity) || 0))}
        </p>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={pending || skus.length === 0}>
          {pending ? "Saving" : "Save order"}
        </Button>
      </form>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-5 py-10">
            <p className="font-display text-2xl">No orders yet</p>
            <p className="mt-2 text-sm text-emerald-950/70">Pending orders sit in Potential. Processing and beyond sit in Confirmed.</p>
          </div>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-emerald-900/50">{order.code}</p>
                  <h3 className="text-lg font-medium">{order.customerName}</h3>
                  <p className="text-sm text-emerald-900/60">
                    {channelLabel(order.channel)} · {order.lines.map((line) => `${line.quantity}× ${line.skuCode}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{formatMoney(order.netAmountCents)}</p>
                  <Select value={order.status} onValueChange={(value) => void changeStatus(order.id, value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>{statusLabel(order.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((item) => (
                        <SelectItem key={item.key} value={item.key}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
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
