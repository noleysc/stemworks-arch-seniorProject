/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { FeatureKey } from "@/lib/ventures/blueprint";
import { hasFeature, luminaryLinkFeature } from "@/lib/ventures/live-features";
import { cn } from "@/lib/utils";

const allLinks = [
  { href: "/luminary", label: "Today" },
  { href: "/luminary/rooms", label: "Rentals" },
  { href: "/luminary/restaurant", label: "Restaurant" },
  { href: "/luminary/import", label: "Collect" },
];

export function LuminaryNav({ features }: { features: FeatureKey[] }) {
  const pathname = usePathname();
  const links = allLinks.filter((link) => hasFeature(features, luminaryLinkFeature(link.href)));

  return (
    <div className="rounded-2xl border border-stone-900/10 bg-white/80 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Luminary Hotel & Co.</p>
          <p className="font-display text-xl leading-none text-stone-950">Rentals desk</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href === "/luminary"
                ? pathname === "/luminary"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
                  active ? "bg-stone-950 text-white" : "text-stone-700 hover:bg-stone-900/5",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
