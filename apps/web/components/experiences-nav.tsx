/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const allLinks = [
  { href: "/thepamperedsoul", label: "Today", match: "exact" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/thepamperedsoul/events", label: "Events", match: "events" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/thepamperedsoul/new", label: "Create event", match: "prefix" as const, roles: ["owner"] as AppRole[] },
  { href: "/thepamperedsoul/calendar", label: "Calendar", match: "prefix" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/thepamperedsoul/bookings", label: "Bookings", match: "prefix" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/thepamperedsoul/guests", label: "Guests", match: "prefix" as const, roles: ["owner", "employee"] as AppRole[] },
  { href: "/thepamperedsoul/crm", label: "CRM", match: "prefix" as const, roles: ["owner"] as AppRole[] },
  { href: "/thepamperedsoul/scorecard", label: "Scorecard", match: "prefix" as const, roles: ["owner"] as AppRole[] },
];

function isActive(pathname: string, link: (typeof allLinks)[number]) {
  if (link.match === "exact") return pathname === "/thepamperedsoul";
  if (link.match === "events") {
    return (
      pathname === "/thepamperedsoul/events" ||
      (pathname.startsWith("/thepamperedsoul/") &&
        pathname !== "/thepamperedsoul/new" &&
        !pathname.startsWith("/thepamperedsoul/new/") &&
        !pathname.startsWith("/thepamperedsoul/calendar") &&
        !pathname.startsWith("/thepamperedsoul/bookings") &&
        !pathname.startsWith("/thepamperedsoul/guests") &&
        !pathname.startsWith("/thepamperedsoul/crm") &&
        !pathname.startsWith("/thepamperedsoul/scorecard") &&
        pathname !== "/thepamperedsoul")
    );
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function ExperiencesNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
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
