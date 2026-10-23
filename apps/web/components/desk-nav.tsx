/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Today" },
  { href: "/rooms", label: "Rentals" },
  { href: "/restaurant", label: "Restaurant" },
  { href: "/import", label: "Collect" },
  { href: "/dashboard?tenant=luminary", label: "Dashboard" },
  { href: "/jade", label: "Jade Flowers" },
];

export function DeskNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <Link href="/" className="block">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">Stemworks</p>
          <p className="font-display text-[1.7rem] leading-none text-stone-950">Luminary Desk</p>
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href.startsWith("/dashboard")
                ? pathname.startsWith("/dashboard")
                : link.href === "/jade"
                  ? pathname.startsWith("/jade")
                  : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
                  active ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100",
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
