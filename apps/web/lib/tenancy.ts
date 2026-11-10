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

export const JADE_EXPERIENCES = {
  key: "jade_experiences",
  name: "Jade Experiences",
  type: "event_production",
  prefixCode: "JE",
  colorToken: "experiences",
  statusLabel: "Event production active",
} as const;

export const JADE_HAVEN = {
  key: "jade_haven",
  name: "Jade Haven",
  type: "wellness_hospitality",
  prefixCode: "JH",
  colorToken: "haven",
  statusLabel: "Pre-revenue · Development phase",
} as const;

export async function ensureTenant(key: keyof typeof TENANTS) {
  const seed = TENANTS[key];
  return prisma.tenant.upsert({
    where: { key: seed.key },
    update: { name: seed.name, planTier: seed.planTier, isActive: true },
    create: { ...seed, isActive: true },
  });
}

async function ensureVenture(
  seed: {
    key: string;
    name: string;
    type: string;
    prefixCode: string;
    colorToken: string;
    statusLabel: string;
  },
) {
  const tenant = await ensureTenant("diaz");
  return prisma.venture.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: seed.key } },
    update: {
      name: seed.name,
      type: seed.type,
      prefixCode: seed.prefixCode,
      colorToken: seed.colorToken,
      statusLabel: seed.statusLabel,
    },
    create: { tenantId: tenant.id, ...seed },
  });
}

export async function ensureJadeFlowers() {
  return ensureVenture(JADE_FLOWERS);
}

export async function ensureJadeExperiences() {
  return ensureVenture(JADE_EXPERIENCES);
}

export async function ensureJadeHaven() {
  return ensureVenture(JADE_HAVEN);
}
