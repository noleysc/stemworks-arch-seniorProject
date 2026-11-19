/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/** Demo ventures — one identity scope each. Roles never cross tenants. */

export const VENTURE_KEYS = ["luminary", "diaz_ventures", "pampered_soul"] as const;

export type VentureKey = (typeof VENTURE_KEYS)[number];

export type VentureMeta = {
  key: VentureKey;
  name: string;
  shortName: string;
  deskHref: string;
  dashboardHref: string;
  portalHref: string;
  vendorHref: string;
  vendorLabel: string;
};

export const VENTURE_META: Record<VentureKey, VentureMeta> = {
  luminary: {
    key: "luminary",
    name: "Luminary Hotel & Co.",
    shortName: "Luminary",
    deskHref: "/luminary",
    dashboardHref: "/dashboard?tenant=luminary",
    portalHref: "/portal?venture=luminary",
    vendorHref: "/vendor?venture=luminary",
    vendorLabel: "Outlet partners",
  },
  diaz_ventures: {
    key: "diaz_ventures",
    name: "Jade Flowers",
    shortName: "Jade",
    deskHref: "/jade",
    dashboardHref: "/dashboard?tenant=diaz_ventures",
    portalHref: "/portal?venture=diaz_ventures",
    vendorHref: "/vendor?venture=diaz_ventures",
    vendorLabel: "Supply partners",
  },
  pampered_soul: {
    key: "pampered_soul",
    name: "The Pampered Soul",
    shortName: "Pampered Soul",
    deskHref: "/thepamperedsoul",
    dashboardHref: "/dashboard?tenant=pampered_soul",
    portalHref: "/portal?venture=pampered_soul",
    vendorHref: "/vendor?venture=pampered_soul",
    vendorLabel: "Event vendors",
  },
};

export function isVentureKey(value: unknown): value is VentureKey {
  return typeof value === "string" && (VENTURE_KEYS as readonly string[]).includes(value);
}

export function listVentures(): VentureMeta[] {
  return VENTURE_KEYS.map((key) => VENTURE_META[key]);
}

export function getVenture(key: VentureKey): VentureMeta {
  return VENTURE_META[key];
}

export function ventureFromPathname(pathname: string): VentureKey | null {
  if (pathname.startsWith("/luminary")) return "luminary";
  if (pathname.startsWith("/jade")) return "diaz_ventures";
  if (pathname.startsWith("/thepamperedsoul")) return "pampered_soul";
  if (pathname.startsWith("/book") || pathname.startsWith("/e/")) return "pampered_soul";
  return null;
}
