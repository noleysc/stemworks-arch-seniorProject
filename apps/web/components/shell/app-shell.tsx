/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RoleSwitcher } from "@/components/shell/role-switcher";
import type { AppRole, RoleDefinition } from "@/lib/auth/roles";
import { usesAppShell } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export function AppShell({
  role,
  definition,
  children,
}: {
  role: AppRole;
  definition: RoleDefinition;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!usesAppShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f5f0e8,_#eef2f6_45%,_#e7ebe8)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-stone-900/10 bg-white/80 px-4 py-5 backdrop-blur md:flex">
          <Link href={definition.homeHref} className="block px-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">Stemworks</p>
            <p className="mt-1 font-display text-2xl leading-none text-stone-950">Desk</p>
          </Link>
          <div className="mt-5 rounded-2xl border border-stone-900/10 bg-stone-50/80 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Signed in as</p>
            <p className="mt-1 font-display text-xl text-stone-950">{definition.label}</p>
            <p className="mt-1 text-xs leading-5 text-stone-600">{definition.summary}</p>
          </div>
          <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
            {definition.nav.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname.startsWith("/dashboard")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                  <span className={cn("block text-[11px]", active ? "text-stone-300" : "text-stone-500")}>
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-stone-200 pt-4">
            <RoleSwitcher role={role} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-stone-900/10 bg-white/85 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">Stemworks</p>
                <p className="font-display text-xl leading-none text-stone-950">{definition.label}</p>
              </div>
              <Link href={definition.homeHref} className="text-sm underline underline-offset-4">
                Home
              </Link>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {definition.nav.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname.startsWith("/dashboard")
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              <RoleSwitcher role={role} />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
