/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { VentureDefinition } from "@/lib/dashboard/types";

export type TenantDefinition = {
  key: string;
  name: string;
  timezone: string;
  deskHref: string;
  ventures: VentureDefinition[];
};

export const TENANT_REGISTRY: Record<string, TenantDefinition> = {
  luminary: {
    key: "luminary",
    name: "Luminary Hotel & Co.",
    timezone: "America/New_York",
    deskHref: "/",
    ventures: [
      { key: "rooms", name: "Luminary Rooms", colorToken: "rooms", module: "hotel", hotelSlice: "rooms" },
      { key: "dining", name: "Luminary Dining", colorToken: "dining", module: "hotel", hotelSlice: "dining" },
      {
        key: "gatherings",
        name: "Luminary Gatherings",
        colorToken: "gatherings",
        module: "hotel",
        hotelSlice: "gatherings",
      },
    ],
  },
  diaz_ventures: {
    key: "diaz_ventures",
    name: "Diaz Ventures LLC",
    timezone: "America/New_York",
    deskHref: "/jade",
    ventures: [
      { key: "jade_flowers", name: "Jade Flowers", colorToken: "jade", module: "product" },
      {
        key: "jade_experiences",
        name: "Jade Experiences",
        colorToken: "experiences",
        module: "placeholder",
      },
      { key: "jade_haven", name: "Jade Haven", colorToken: "haven", module: "placeholder" },
      { key: "stemworks", name: "Stemworks", colorToken: "stemworks", module: "placeholder" },
    ],
  },
};

export function listTenants() {
  return Object.values(TENANT_REGISTRY).map((tenant) => ({
    key: tenant.key,
    name: tenant.name,
    deskHref: tenant.deskHref,
    ventureCount: tenant.ventures.length,
  }));
}

export function getTenant(key: string): TenantDefinition | null {
  return TENANT_REGISTRY[key] ?? null;
}
