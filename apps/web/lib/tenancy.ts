/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { prisma } from "@/lib/db";

export const TENANTS = {
  luminary: {
    key: "luminary",
    name: "Luminary Hotel & Co.",
    planTier: "internal",
  },
  diaz: {
    key: "diaz_ventures",
    name: "Diaz Ventures LLC",
    planTier: "internal",
  },
} as const;

export const JADE_FLOWERS = {
  key: "jade_flowers",
  name: "Jade Flowers",
  type: "product_brand",
  prefixCode: "JF",
  colorToken: "jade",
  statusLabel: "Active revenue",
} as const;

export async function ensureTenant(key: keyof typeof TENANTS) {
  const seed = TENANTS[key];
  return prisma.tenant.upsert({
    where: { key: seed.key },
    update: { name: seed.name, planTier: seed.planTier, isActive: true },
    create: { ...seed, isActive: true },
  });
}

export async function ensureJadeFlowers() {
  const tenant = await ensureTenant("diaz");
  return prisma.venture.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: JADE_FLOWERS.key } },
    update: {
      name: JADE_FLOWERS.name,
      type: JADE_FLOWERS.type,
      prefixCode: JADE_FLOWERS.prefixCode,
      colorToken: JADE_FLOWERS.colorToken,
      statusLabel: JADE_FLOWERS.statusLabel,
    },
    create: { tenantId: tenant.id, ...JADE_FLOWERS },
  });
}
