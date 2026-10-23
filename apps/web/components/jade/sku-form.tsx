/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SkuForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/jade/skus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.get("code"),
          name: form.get("name"),
          retail: form.get("retail"),
          wholesale: form.get("wholesale"),
          event: form.get("event"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "The SKU did not save.");
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
      <h2 className="font-display text-2xl">Add SKU</h2>
      <Field label="Code">
        <Input name="code" className="font-mono uppercase" required />
      </Field>
      <Field label="Name">
        <Input name="name" required />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Retail">
          <Input name="retail" placeholder="0.00" required />
        </Field>
        <Field label="Wholesale">
          <Input name="wholesale" placeholder="0.00" required />
        </Field>
        <Field label="Event">
          <Input name="event" placeholder="0.00" required />
        </Field>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving" : "Save SKU"}
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
