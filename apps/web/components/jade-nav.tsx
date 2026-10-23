/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/jade", label: "Today" },
  { href: "/jade/materials", label: "Materials" },
  { href: "/jade/skus", label: "SKUs" },
  { href: "/jade/orders", label: "Orders" },
  { href: "/dashboard?tenant=diaz_ventures", label: "Dashboard" },
];

export function JadeNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-[#f4f7f4]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <Link href="/jade" className="block">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-900/60">Stemworks · Diaz Ventures</p>
          <p className="font-display text-[1.7rem] leading-none text-emerald-950">Jade Flowers</p>
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = link.href.startsWith("/dashboard")
              ? pathname.startsWith("/dashboard")
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
                  active ? "bg-emerald-950 text-white" : "text-emerald-950/70 hover:bg-emerald-900/5",
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
