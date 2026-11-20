/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/**
 * Per-venture demo roles. Login locks you into one venture + role.
 * Stemworks app ownership is the only way to browse every venture.
 */

import {
  type VentureKey,
  getVenture,
  listVentures,
  ventureFromPathname,
} from "@/lib/auth/ventures";

export const ROLE_COOKIE = "stemworks_role";
export const SESSION_COOKIE = "stemworks_session";

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
  ventureKey: VentureKey;
  ventureName: string;
  persona: string;
};

export const DEFAULT_ROLE: AppRole = "owner";
export const DEFAULT_VENTURE: VentureKey = "pampered_soul";

const PERSONAS: Record<VentureKey, Record<AppRole, string>> = {
  luminary: {
    owner: "Alex Rivera",
    employee: "Jordan Lee",
    customer: "Sam Guest",
    vendor: "Coastal AV Co.",
  },
  diaz_ventures: {
    owner: "Nolan Diaz",
    employee: "Casey Pour",
    customer: "Retail Buyer",
    vendor: "Wax & Wick Supply",
  },
  pampered_soul: {
    owner: "Morgan Spa",
    employee: "Riley Desk",
    customer: "Blake Guest",
    vendor: "Jade Haven",
  },
};

export const APP_OWNER_PERSONA = "Stemworks Owner";

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

function ownerNav(venture: VentureKey): NavItem[] {
  const meta = getVenture(venture);
  return [
    { href: meta.dashboardHref, label: "Command board", description: `${meta.shortName} money + attention` },
    { href: meta.deskHref, label: `${meta.shortName} desk`, description: "Operating surface" },
    { href: "/organize", label: "Organize ventures", description: "Metrics + features" },
  ];
}

function employeeNav(venture: VentureKey): NavItem[] {
  if (venture === "luminary") {
    return [
      { href: "/luminary", label: "Today", description: "Arrivals and covers" },
      { href: "/luminary/rooms", label: "Rentals", description: "Open stays" },
      { href: "/luminary/restaurant", label: "Restaurant", description: "Tonight’s book" },
      { href: "/luminary/import", label: "Collect", description: "Bring files in" },
    ];
  }
  if (venture === "diaz_ventures") {
    return [
      { href: "/jade", label: "Today", description: "Product floor" },
      { href: "/jade/materials", label: "Materials", description: "On-hand stock" },
      { href: "/jade/products", label: "Products", description: "Finished goods" },
      { href: "/jade/batches", label: "Batches", description: "Pour and release" },
      { href: "/jade/orders", label: "Orders", description: "Open orders" },
    ];
  }
  return [
    { href: "/thepamperedsoul", label: "Today", description: "Spa desk hub" },
    { href: "/thepamperedsoul/calendar", label: "Schedule", description: "Events and appointments" },
    { href: "/thepamperedsoul/guests", label: "Check-in", description: "Ticketed guests" },
    { href: "/thepamperedsoul/bookings", label: "Bookings", description: "Spa appointments" },
  ];
}

function customerNav(venture: VentureKey): NavItem[] {
  const meta = getVenture(venture);
  if (venture === "pampered_soul") {
    return [
      { href: meta.portalHref, label: "My portal", description: "Tickets and appointments" },
      { href: "/book", label: "Book a service", description: "Spa appointment" },
      { href: "/book?loop=1", label: "Lobby display", description: "Kiosk loop" },
    ];
  }
  if (venture === "luminary") {
    return [
      { href: meta.portalHref, label: "Guest portal", description: "Your stay and dining" },
      { href: "/luminary", label: "Property info", description: "Luminary overview" },
    ];
  }
  return [
    { href: meta.portalHref, label: "Shopper portal", description: "Your Jade orders" },
    { href: "/jade/products", label: "Products", description: "Finished goods" },
  ];
}

function vendorNav(venture: VentureKey): NavItem[] {
  const meta = getVenture(venture);
  return [{ href: meta.vendorHref, label: meta.vendorLabel, description: `${meta.shortName} partner desk` }];
}

const ROLE_COPY: Record<
  AppRole,
  { label: string; kernelHint: string; summary: (name: string) => string; canSeeMoney: boolean; canEditInvites: boolean; canOperateDesk: boolean }
> = {
  owner: {
    label: "Owner",
    kernelHint: "owner",
    summary: (name) => `Full ${name} board — money, desks, and settings for this venture only. Locked until you sign out.`,
    canSeeMoney: true,
    canEditInvites: true,
    canOperateDesk: true,
  },
  employee: {
    label: "Employee",
    kernelHint: "manager / associate",
    summary: (name) => `${name} floor ops only. Locked to this venture until you sign out.`,
    canSeeMoney: false,
    canEditInvites: false,
    canOperateDesk: true,
  },
  customer: {
    label: "Customer",
    kernelHint: "client",
    summary: (name) => `${name} guest/shopper surface — locked to this venture.`,
    canSeeMoney: false,
    canEditInvites: false,
    canOperateDesk: false,
  },
  vendor: {
    label: "Vendor",
    kernelHint: "partner",
    summary: (name) => `${name} partner desk — locked to this venture’s partners.`,
    canSeeMoney: false,
    canEditInvites: false,
    canOperateDesk: false,
  },
};

export function getRole(role: AppRole, venture: VentureKey = DEFAULT_VENTURE): RoleDefinition {
  const meta = getVenture(venture);
  const copy = ROLE_COPY[role];
  const nav =
    role === "owner"
      ? ownerNav(venture)
      : role === "employee"
        ? employeeNav(venture)
        : role === "customer"
          ? customerNav(venture)
          : vendorNav(venture);
  const homeHref =
    role === "owner"
      ? meta.dashboardHref
      : role === "employee"
        ? meta.deskHref
        : role === "customer"
          ? meta.portalHref
          : meta.vendorHref;

  return {
    key: role,
    label: copy.label,
    kernelHint: copy.kernelHint,
    summary: copy.summary(meta.shortName),
    homeHref,
    nav,
    canSeeMoney: copy.canSeeMoney,
    canEditInvites: copy.canEditInvites && venture === "pampered_soul",
    canOperateDesk: copy.canOperateDesk,
    ventureKey: venture,
    ventureName: meta.name,
    persona: PERSONAS[venture][role],
  };
}

/** Stemworks app ownership — browse every venture as owner of the active desk. */
export function getAppOwnerDefinition(venture: VentureKey = DEFAULT_VENTURE): RoleDefinition {
  const meta = getVenture(venture);
  const desks = listVentures().map((item) => ({
    href: item.deskHref,
    label: item.shortName,
    description: item.name,
  }));
  return {
    key: "owner",
    label: "App owner",
    kernelHint: "stemworks_owner",
    summary: `Stemworks ownership — view every venture. Currently looking at ${meta.shortName}.`,
    homeHref: "/",
    nav: [
      { href: "/", label: "All desks", description: "Pick any venture" },
      { href: "/organize", label: "Organize ventures", description: "Create · metrics · features" },
      ...desks,
      { href: meta.dashboardHref, label: "Command board", description: `${meta.shortName} money + attention` },
    ],
    canSeeMoney: true,
    canEditInvites: true,
    canOperateDesk: true,
    ventureKey: venture,
    ventureName: meta.name,
    persona: APP_OWNER_PERSONA,
  };
}

export function listRoles(venture: VentureKey = DEFAULT_VENTURE): RoleDefinition[] {
  return APP_ROLES.map((key) => getRole(key, venture));
}

export function homeForRole(role: AppRole, venture: VentureKey = DEFAULT_VENTURE): string {
  return getRole(role, venture).homeHref;
}

export function usesAppShell(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname === "/login" || pathname.startsWith("/login/")) return false;
  if (pathname.startsWith("/e/")) return false;
  if (pathname === "/book" || pathname.startsWith("/book/")) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/organize") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/luminary") ||
    pathname.startsWith("/jade") ||
    pathname.startsWith("/thepamperedsoul") ||
    pathname.startsWith("/v/")
  );
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname.startsWith("/e/")) return true;
  if (pathname === "/book" || pathname.startsWith("/book/")) return true;
  return false;
}

export function roleAllowsPath(role: AppRole, pathname: string, venture: VentureKey): boolean {
  if (pathname.startsWith("/e/") || pathname === "/book" || pathname.startsWith("/book/")) {
    return venture === "pampered_soul" && (role === "customer" || role === "owner" || role === "employee");
  }
  if (pathname === "/") return true;

  const pathVenture = ventureFromPathname(pathname);
  if (pathVenture && pathVenture !== venture) {
    return false;
  }

  if (pathname.startsWith("/dashboard")) {
    return role === "owner" || role === "employee";
  }

  if (role === "owner") {
    return (
      pathname.startsWith(getVenture(venture).deskHref) ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/organize") ||
      pathname.startsWith("/v/") ||
      pathname.startsWith("/portal") ||
      pathname.startsWith("/vendor")
    );
  }

  if (role === "employee") {
    if (venture === "pampered_soul") {
      if (pathname.startsWith("/thepamperedsoul/new")) return false;
      if (pathname.startsWith("/thepamperedsoul/crm")) return false;
      if (pathname.startsWith("/thepamperedsoul/scorecard")) return false;
    }
    return pathname.startsWith(getVenture(venture).deskHref) || pathname.startsWith("/dashboard");
  }

  if (role === "customer") {
    return (
      pathname.startsWith("/portal") ||
      (venture === "pampered_soul" && (pathname.startsWith("/book") || pathname.startsWith("/e/"))) ||
      (venture === "luminary" && pathname.startsWith("/luminary")) ||
      (venture === "diaz_ventures" && pathname.startsWith("/jade/products"))
    );
  }

  if (role === "vendor") {
    return pathname.startsWith("/vendor");
  }

  return false;
}

export function appOwnerAllowsPath(pathname: string): boolean {
  if (isPublicPath(pathname)) return true;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/organize") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/luminary") ||
    pathname.startsWith("/jade") ||
    pathname.startsWith("/thepamperedsoul") ||
    pathname.startsWith("/v/")
  );
}

export function listVentureOptions() {
  return listVentures();
}
