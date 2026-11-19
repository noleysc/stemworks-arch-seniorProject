/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/**
 * Frontend demo roles for the Stemworks shell.
 * Architecture kernel roles are owner | manager | associate | client | platform_admin.
 * This UI maps the product language teammates use:
 *   owner → owner
 *   employee → manager / associate operational desk
 *   customer → client
 *   vendor → participating business on an invite (not a kernel role yet)
 */

export const ROLE_COOKIE = "stemworks_role";

export const APP_ROLES = ["owner", "employee", "customer", "vendor"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export type RoleDefinition = {
  key: AppRole;
  label: string;
  kernelHint: string;
  summary: string;
  homeHref: string;
  nav: NavItem[];
  canSeeMoney: boolean;
  canEditInvites: boolean;
  canOperateDesk: boolean;
};

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  owner: {
    key: "owner",
    label: "Owner",
    kernelHint: "owner",
    summary: "Full command board across tenants, ventures, and money.",
    homeHref: "/dashboard",
    canSeeMoney: true,
    canEditInvites: true,
    canOperateDesk: true,
    nav: [
      { href: "/dashboard", label: "Command board", description: "Confirmed, Potential, attention" },
      { href: "/", label: "Luminary rentals", description: "Hotel desk" },
      { href: "/jade", label: "Jade Flowers", description: "Product ops" },
      { href: "/experiences", label: "Pampered Soul", description: "Spa business desk" },
    ],
  },
  employee: {
    key: "employee",
    label: "Employee",
    kernelHint: "manager / associate",
    summary: "Day-to-day operations — schedule, check-in, bookings. No parent P&L.",
    homeHref: "/dashboard",
    canSeeMoney: false,
    canEditInvites: false,
    canOperateDesk: true,
    nav: [
      { href: "/dashboard", label: "Today", description: "Shift overview" },
      { href: "/experiences/calendar", label: "Schedule", description: "Invites and appointments" },
      { href: "/experiences/guests", label: "Check-in", description: "Ticketed guests" },
      { href: "/experiences/bookings", label: "Bookings", description: "Spa appointments" },
      { href: "/jade/batches", label: "Batches", description: "Product floor" },
    ],
  },
  customer: {
    key: "customer",
    label: "Customer",
    kernelHint: "client",
    summary: "Book services, buy tickets, and see your own confirmations.",
    homeHref: "/portal",
    canSeeMoney: false,
    canEditInvites: false,
    canOperateDesk: false,
    nav: [
      { href: "/portal", label: "My portal", description: "Tickets and appointments" },
      { href: "/book", label: "Book a service", description: "Spa appointment" },
    ],
  },
  vendor: {
    key: "vendor",
    label: "Vendor",
    kernelHint: "event participant",
    summary: "See events you participate in and guests who opted into your marketing.",
    homeHref: "/vendor",
    canSeeMoney: false,
    canEditInvites: false,
    canOperateDesk: false,
    nav: [
      { href: "/vendor", label: "Vendor desk", description: "Participating events" },
    ],
  },
};

export const DEFAULT_ROLE: AppRole = "owner";

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function getRole(role: AppRole): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

export function listRoles(): RoleDefinition[] {
  return APP_ROLES.map((key) => ROLE_DEFINITIONS[key]);
}

export function homeForRole(role: AppRole): string {
  return ROLE_DEFINITIONS[role].homeHref;
}

/** Destinations that use the dashboard shell (sidebar + role switcher). */
export function usesAppShell(pathname: string): boolean {
  if (pathname.startsWith("/e/")) return false;
  if (pathname === "/book" || pathname.startsWith("/book/")) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/vendor") ||
    pathname === "/" ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/restaurant") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/jade") ||
    pathname.startsWith("/experiences")
  );
}

export function roleAllowsPath(role: AppRole, pathname: string): boolean {
  const def = ROLE_DEFINITIONS[role];
  if (pathname.startsWith("/e/") || pathname === "/book" || pathname.startsWith("/book/")) {
    return role === "customer" || role === "owner" || role === "employee";
  }
  if (role === "owner") return true;
  if (role === "employee") {
    if (pathname.startsWith("/experiences/new")) return false;
    if (pathname.startsWith("/experiences/crm")) return false;
    if (pathname.startsWith("/experiences/scorecard")) return false;
    return (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/experiences") ||
      pathname.startsWith("/jade") ||
      pathname === "/"
    );
  }
  if (role === "customer") {
    return pathname.startsWith("/portal") || pathname === "/book" || pathname.startsWith("/book/") || pathname.startsWith("/e/");
  }
  if (role === "vendor") {
    return pathname.startsWith("/vendor");
  }
  return def.nav.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
