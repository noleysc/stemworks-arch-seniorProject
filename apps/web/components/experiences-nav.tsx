/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const allLinks = [
  { href: "/experiences", label: "Today", match: "exact" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/experiences/events", label: "Events", match: "events" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/experiences/new", label: "Create invite", match: "prefix" as const, roles: ["owner"] as AppRole[] },
  { href: "/experiences/calendar", label: "Calendar", match: "prefix" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/experiences/bookings", label: "Bookings", match: "prefix" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/experiences/guests", label: "Guests", match: "prefix" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/experiences/crm", label: "CRM", match: "prefix" as const, roles: ["owner"] as AppRole[] },
  { href: "/experiences/scorecard", label: "Scorecard", match: "prefix" as const, roles: ["owner"] as AppRole[] },
];

function isActive(pathname: string, link: (typeof allLinks)[number]) {
  if (link.match === "exact") return pathname === "/experiences";
  if (link.match === "events") {
    return (
      pathname === "/experiences/events" ||
      pathname === "/experiences/new" ||
      (pathname.startsWith("/experiences/") &&
        !pathname.startsWith("/experiences/calendar") &&
        !pathname.startsWith("/experiences/bookings") &&
        !pathname.startsWith("/experiences/guests") &&
        !pathname.startsWith("/experiences/crm") &&
        !pathname.startsWith("/experiences/scorecard") &&
        pathname !== "/experiences")
    );
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function readRoleCookie(): AppRole {
  if (typeof document === "undefined") return "owner";
  const match = document.cookie.match(/(?:^|; )stemworks_role=([^;]*)/);
  const value = match?.[1];
  if (value === "employee" || value === "customer" || value === "vendor" || value === "owner") return value;
  return "owner";
}

export function ExperiencesNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<AppRole>("owner");

  useEffect(() => {
    setRole(readRoleCookie());
  }, [pathname]);

  const links = allLinks.filter((link) => link.roles.includes(role));

  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Pampered Soul</p>
          <p className="font-display text-xl leading-none text-slate-950">Spa desk</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = isActive(pathname, link);
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
    </div>
  );
}
