/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { APP_ROLES, listRoles, type AppRole } from "@/lib/auth/roles";
import { listVentures, type VentureKey } from "@/lib/auth/ventures";
import { cn } from "@/lib/utils";

export function LoginGate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [venture, setVenture] = useState<VentureKey | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const ventures = listVentures();
  const roles = venture ? listRoles(venture) : [];

  async function post(body: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/v1/session/role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { homeHref?: string; error?: string };
    if (!response.ok) throw new Error(payload.error || "Could not sign in.");
    startTransition(() => {
      router.push(payload.homeHref || "/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Stemworks</p>
        <h1 className="mt-2 font-display text-5xl text-stone-950">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Pick a venture, then a role. After you enter, you stay locked in that venture until you sign out. Stemworks
          app ownership is the only way to browse every desk.
        </p>
      </div>

      <section className="mt-10 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">1 · Venture</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {ventures.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={pending}
              onClick={() => {
                setVenture(item.key);
                setRole(null);
              }}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                venture === item.key
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-900/10 bg-white/90 text-stone-800 hover:border-stone-900/30",
              )}
            >
              <span className="block font-display text-2xl leading-none">{item.shortName}</span>
              <span className={cn("mt-2 block text-xs leading-5", venture === item.key ? "text-stone-300" : "text-stone-500")}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">2 · Role</p>
        {!venture ? (
          <p className="text-sm text-stone-500">Select a venture to see its owner, staff, guests, and vendors.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={pending}
                onClick={() => setRole(item.key)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition",
                  role === item.key
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-900/10 bg-white/90 text-stone-800 hover:border-stone-900/30",
                )}
              >
                <span className="block text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={pending || !venture || !role}
          onClick={() => {
            if (!venture || !role) return;
            void post({ action: "login", venture, role }).catch((err) => {
              setError(err instanceof Error ? err.message : "Could not sign in.");
            });
          }}
          className={cn(
            "rounded-full bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition",
            (!venture || !role || pending) && "opacity-40",
          )}
        >
          {pending ? "Signing in…" : "Enter this venture"}
        </button>
        <p className="text-xs text-stone-500">
          {venture && role
            ? `Locks you into ${ventures.find((v) => v.key === venture)?.shortName} as ${role}.`
            : "You cannot change venture after entering."}
        </p>
      </div>

      <div className="mt-12 border-t border-stone-200 pt-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">App ownership</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
          Stemworks app ownership can open every venture desk and board. Venture roles stay locked to one tenant.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void post({ action: "login_app_owner", venture: venture ?? "luminary" }).catch((err) => {
              setError(err instanceof Error ? err.message : "Could not sign in.");
            });
          }}
          className="mt-4 rounded-full border border-stone-900/20 bg-white px-5 py-2.5 text-sm font-medium text-stone-900 transition hover:border-stone-900/40"
        >
          Enter as Stemworks app owner
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="mt-10 text-[11px] text-stone-400">Demo roles: {APP_ROLES.join(" · ")}</p>
    </div>
  );
}
