/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestErrorMessage, requestJson } from "@/lib/http";

export function MassageBookImportPanel() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number; issues: string[] } | null>(
    null,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const payload = await requestJson<{ created: number; skipped: number; issues: string[] }>(
        "/api/experiences/appointments/import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: form.get("csv") }),
        },
        "We couldn’t import that MassageBook export. Check the columns and try again.",
      );
      setResult(payload);
      router.refresh();
    } catch (err) {
      setError(
        requestErrorMessage(
          err,
          "We couldn’t import that MassageBook export. Check the columns and try again.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-900/10 bg-white/90 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-slate-950">MassageBook import</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paste a CSV export. Required columns: client name, date, time. Email strongly recommended.
          </p>
        </div>
        <a
          href="/api/experiences/appointments/import"
          className="text-sm underline underline-offset-4"
        >
          Download template
        </a>
      </div>

      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {result ? (
        <p className="text-sm text-slate-700">
          Imported {result.created}. Skipped {result.skipped}.
          {result.issues.length > 0 ? ` First issues: ${result.issues.slice(0, 3).join(" · ")}` : ""}
        </p>
      ) : null}

      <div>
        <Label htmlFor="mb-csv">CSV</Label>
        <Textarea id="mb-csv" name="csv" rows={8} required placeholder="client_name,email,phone,..." />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Importing…" : "Import appointments"}
      </Button>
    </form>
  );
}
