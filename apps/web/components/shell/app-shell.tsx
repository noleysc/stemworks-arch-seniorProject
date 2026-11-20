/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SessionPanel } from "@/components/shell/session-panel";
import type { AppRole, RoleDefinition } from "@/lib/auth/roles";
import { usesAppShell } from "@/lib/auth/roles";
import type { VentureKey } from "@/lib/auth/ventures";
import { cn } from "@/lib/utils";

export function AppShell({
  role,
  venture,
  definition,
  appOwner,
  children,
}: {
  role: AppRole;
  venture: VentureKey;
  definition: RoleDefinition;
  appOwner: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!usesAppShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f5f0e8,_#eef2f6_45%,_#e7ebe8)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-stone-900/10 bg-white/80 px-4 py-5 backdrop-blur md:flex">
          <Link href={definition.homeHref} className="block px-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">Stemworks</p>
            <p className="mt-1 font-display text-2xl leading-none text-stone-950">
              {appOwner ? "All ventures" : definition.ventureName}
            </p>
          </Link>
          <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
            {definition.nav.map((item) => {
              const pathOnly = item.href.split("?")[0];
              const active =
                pathOnly === "/dashboard"
                  ? pathname.startsWith("/dashboard")
                  : pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 transition",
                    active ? "bg-stone-950 text-white" : "text-stone-700 hover:bg-stone-900/5",
                  )}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-stone-200 pt-4">
            <SessionPanel
              role={role}
              venture={venture}
              appOwner={appOwner}
              persona={definition.persona}
              ventureName={definition.ventureName}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-stone-900/10 bg-white/85 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                  {definition.ventureName}
                </p>
                <p className="font-display text-xl leading-none text-stone-950">
                  {definition.persona} · {definition.label}
                </p>
              </div>
              <Link href={definition.homeHref} className="text-sm underline underline-offset-4">
                Home
              </Link>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {definition.nav.map((item) => {
                const pathOnly = item.href.split("?")[0];
                const active =
                  pathOnly === "/dashboard"
                    ? pathname.startsWith("/dashboard")
                    : pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
                      active ? "bg-stone-950 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3">
              <SessionPanel
                role={role}
                venture={venture}
                appOwner={appOwner}
                persona={definition.persona}
                ventureName={definition.ventureName}
              />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
