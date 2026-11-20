/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { FeatureKey } from "@/lib/ventures/blueprint";
import { hasFeature, jadeLinkFeature } from "@/lib/ventures/live-features";
import { cn } from "@/lib/utils";

const allLinks = [
  { href: "/jade", label: "Today" },
  { href: "/jade/materials", label: "Materials" },
  { href: "/jade/products", label: "Products" },
  { href: "/jade/batches", label: "Batches" },
  { href: "/jade/orders", label: "Orders" },
];

export function JadeNav({ features }: { features: FeatureKey[] }) {
  const pathname = usePathname();
  const links = allLinks.filter((link) => hasFeature(features, jadeLinkFeature(link.href)));

  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white/80 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-900/60">Jade Flowers</p>
          <p className="font-display text-xl leading-none text-emerald-950">Product desk</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href === "/jade/products"
                ? pathname.startsWith("/jade/products") || pathname.startsWith("/jade/skus")
                : link.href === "/jade"
                  ? pathname === "/jade"
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
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
    </div>
  );
}
