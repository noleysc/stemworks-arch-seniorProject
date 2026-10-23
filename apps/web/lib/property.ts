/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { prisma } from "@/lib/db";
import { ensureTenant } from "@/lib/tenancy";

export const LUMINARY = {
  key: "luminary",
  name: "Luminary Hotel & Co.",
  address: "2200 Edwards Drive, Fort Myers, Florida 33901",
  timezone: "America/New_York",
  keys: 243,
} as const;

export const SEED_SOURCES = [
  { key: "luminary_website", label: "Luminary website", importShape: "stay" },
  { key: "airbnb", label: "Airbnb", importShape: "airbnb" },
] as const;

export type ImportShape = "stay" | "airbnb";

export type RentalSourceRecord = {
  key: string;
  label: string;
  importShape: ImportShape;
};

const sourceKeyPattern = /^[a-z][a-z0-9_]{0,40}$/;

export async function ensureLuminary() {
  const tenant = await ensureTenant("luminary");
  const property = await prisma.property.upsert({
    where: { key: LUMINARY.key },
    update: {
      tenantId: tenant.id,
      name: LUMINARY.name,
      address: LUMINARY.address,
      timezone: LUMINARY.timezone,
      keys: LUMINARY.keys,
    },
    create: { tenantId: tenant.id, ...LUMINARY },
  });

  for (const source of SEED_SOURCES) {
    await prisma.rentalSource.upsert({
      where: { propertyId_key: { propertyId: property.id, key: source.key } },
      update: { label: source.label, importShape: source.importShape },
      create: { propertyId: property.id, ...source },
    });
  }

  return property;
}

export async function listRentalSources(): Promise<RentalSourceRecord[]> {
  const property = await ensureLuminary();
  const rows = await prisma.rentalSource.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    importShape: row.importShape === "airbnb" ? "airbnb" : "stay",
  }));
}

export async function registerRentalSource(input: { key: string; label: string; importShape: string }) {
  const key = input.key.trim();
  const label = input.label.trim();
  if (!sourceKeyPattern.test(key)) {
    throw new Error("Source key must be lowercase letters, numbers, and underscores.");
  }
  if (!label || label.length > 80) {
    throw new Error("Source label is required.");
  }
  if (input.importShape !== "stay" && input.importShape !== "airbnb") {
    throw new Error("Import shape must be stay or airbnb.");
  }

  const property = await ensureLuminary();
  const existing = await prisma.rentalSource.findUnique({
    where: { propertyId_key: { propertyId: property.id, key } },
  });
  if (existing) {
    throw new Error("That rental source is already on this property.");
  }

  await prisma.rentalSource.create({
    data: { propertyId: property.id, key, label, importShape: input.importShape },
  });

  return { key, label, importShape: input.importShape as ImportShape };
}
