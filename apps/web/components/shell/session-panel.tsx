/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useEffect, useState } from "react";

import type { AppRole } from "@/lib/auth/roles";
import { listVentures, type VentureKey } from "@/lib/auth/ventures";
import { cn } from "@/lib/utils";

export function SessionPanel({
  role,
  venture,
  appOwner,
  persona,
  ventureName,
}: {
  role: AppRole;
  venture: VentureKey;
  appOwner: boolean;
  persona: string;
  ventureName: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ventures = listVentures();

  useEffect(() => {
    const restore = () => setPending(false);
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  async function post(body: Record<string, unknown>, fallbackHref = "/login") {
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/v1/session/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { homeHref?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update session.");
      window.location.assign(body.action === "logout" ? "/login" : payload.homeHref || fallbackHref);
    } catch (error) {
      setPending(false);
      throw error;
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-stone-50/90 px-3 py-2.5 ring-1 ring-stone-200">
        <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
          {appOwner ? "App owner" : "Signed in"}
        </p>
        <p className="mt-1 text-sm font-medium text-stone-900">{persona}</p>
        <p className="text-xs text-stone-600">
          {appOwner ? `Viewing ${ventureName}` : `${role} · ${ventureName}`}
        </p>
      </div>

      {appOwner ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">View venture</p>
          <div className="grid gap-1.5">
            {ventures.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={pending}
                onClick={() => {
                  if (item.key === venture || pending) return;
                  void post({ action: "switch_venture", venture: item.key }, item.deskHref).catch((err) => {
                    setError(err instanceof Error ? err.message : "Could not switch.");
                  });
                }}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-left text-sm transition",
                  item.key === venture
                    ? "bg-stone-950 text-white"
                    : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100",
                  pending && "opacity-60",
                )}
              >
                {item.shortName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          void post({ action: "logout" }).catch((err) => {
            setError(err instanceof Error ? err.message : "Could not sign out.");
          });
        }}
        className="w-full rounded-lg bg-white px-2.5 py-2 text-left text-sm text-stone-800 ring-1 ring-stone-200 hover:bg-stone-100"
      >
        Sign out
      </button>

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
