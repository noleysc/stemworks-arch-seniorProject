/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/experiences", label: "Events" },
  { href: "/experiences/new", label: "Plan event" },
  { href: "/experiences/guests", label: "Guests" },
  { href: "/experiences/crm", label: "Private CRM" },
  { href: "/experiences/scorecard", label: "Scorecard" },
  { href: "/dashboard?tenant=pampered_soul", label: "Dashboard" },
];

export function ExperiencesNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/10 bg-[#eef2f6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <Link href="/experiences" className="block">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-600">
            Stemworks · Owner desk
          </p>
          <p className="font-display text-[1.7rem] leading-none text-slate-950">The Pampered Soul</p>
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = link.href.startsWith("/dashboard")
              ? pathname.startsWith("/dashboard")
              : link.href === "/experiences"
                ? pathname === "/experiences"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
                  active ? "bg-slate-950 text-[#eef2f6]" : "text-slate-700 hover:bg-slate-900/5",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
