/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { VentureKey } from "@/lib/auth/ventures";
import { cn } from "@/lib/utils";

export function VentureDeskLink({
  venture,
  href,
  title,
  body,
  pathLabel,
  className,
}: {
  venture: VentureKey;
  href: string;
  title: string;
  body: string;
  pathLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function openDesk() {
    setError(null);
    try {
      const response = await fetch("/api/v1/session/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ venture }),
      });
      const payload = (await response.json()) as { homeHref?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not switch venture.");
      startTransition(() => {
        router.push(href);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open desk.");
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void openDesk()}
      className={cn(
        "rounded-3xl border border-stone-900/10 bg-white/90 p-6 text-left transition hover:border-stone-900/30",
        pending && "opacity-60",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">{pathLabel}</p>
      <p className="mt-2 font-display text-3xl text-stone-950">{title}</p>
      <p className="mt-3 text-sm leading-6 text-stone-600">{body}</p>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-stone-500">
          {pending ? "Switching identity…" : "Own owner · staff · guests · vendors"}
        </p>
      )}
    </button>
  );
}
