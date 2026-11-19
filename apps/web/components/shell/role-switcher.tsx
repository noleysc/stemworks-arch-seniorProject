/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AppRole } from "@/lib/auth/roles";
import { listRoles } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export function RoleSwitcher({ role }: { role: AppRole }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const roles = listRoles();

  async function select(next: AppRole) {
    if (next === role || pending) return;
    setError(null);
    try {
      const response = await fetch("/api/v1/session/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const body = (await response.json()) as { homeHref?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Could not switch role.");
      startTransition(() => {
        router.push(body.homeHref || "/dashboard");
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch role.");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Demo role</p>
      <div className="grid grid-cols-2 gap-1.5">
        {roles.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={pending}
            onClick={() => void select(item.key)}
            className={cn(
              "rounded-lg px-2.5 py-2 text-left text-sm transition",
              item.key === role
                ? "bg-stone-950 text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100",
              pending && "opacity-60",
            )}
          >
            <span className="block font-medium leading-tight">{item.label}</span>
            <span className={cn("mt-0.5 block text-[11px] leading-snug", item.key === role ? "text-stone-300" : "text-stone-500")}>
              {item.kernelHint}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : (
        <p className="text-[11px] leading-4 text-stone-500">Cookie demo until real login ships.</p>
      )}
    </div>
  );
}
