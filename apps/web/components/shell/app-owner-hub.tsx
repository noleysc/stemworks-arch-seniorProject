/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { listVentures, type VentureKey } from "@/lib/auth/ventures";
import { cn } from "@/lib/utils";

export function AppOwnerHub({ activeVenture }: { activeVenture: VentureKey }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ventures = listVentures();

  async function openVenture(venture: VentureKey, href: string) {
    setError(null);
    try {
      const response = await fetch("/api/v1/session/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "switch_venture", venture }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not open venture.");
      startTransition(() => {
        router.push(href);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open venture.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Stemworks · App ownership</p>
        <h1 className="mt-2 font-display text-5xl text-stone-950">Every venture</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          You own the Stemworks app, so every desk is available. Venture-locked staff, guests, and vendors still only
          see their own tenant after a normal role login.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {ventures.map((venture) => (
          <button
            key={venture.key}
            type="button"
            disabled={pending}
            onClick={() => void openVenture(venture.key, venture.deskHref)}
            className={cn(
              "rounded-3xl border bg-white/90 p-6 text-left transition hover:border-stone-900/30",
              venture.key === activeVenture ? "border-stone-950" : "border-stone-900/10",
              pending && "opacity-60",
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">{venture.deskHref}</p>
            <p className="mt-2 font-display text-3xl text-stone-950">{venture.shortName}</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">{venture.name}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-stone-500">
              {venture.key === activeVenture ? "Active view" : "Open desk"}
            </p>
          </button>
        ))}
      </div>

      <p className="mt-8 text-sm text-stone-600">
        Boards:{" "}
        {ventures.map((venture, index) => (
          <span key={venture.key}>
            {index > 0 ? " · " : null}
            <Link href={venture.dashboardHref} className="underline underline-offset-4">
              {venture.shortName}
            </Link>
          </span>
        ))}
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
