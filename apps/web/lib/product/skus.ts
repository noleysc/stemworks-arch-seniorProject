/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";
import { ensureJadeFlowers } from "@/lib/tenancy";

export const skuInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "SKU code is required.")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "SKU name is required.").max(160),
  retail: z.string().trim().min(1, "Retail price is required."),
  wholesale: z.string().trim().min(1, "Wholesale price is required."),
  event: z.string().trim().min(1, "Event price is required."),
});

export type SkuRecord = {
  id: string;
  code: string;
  name: string;
  retailCents: number;
  wholesaleCents: number;
  eventCents: number;
  unitsOnHand: number;
  unitsAllocated: number;
  availableToSell: number;
  isActive: boolean;
};

export async function listSkus(): Promise<SkuRecord[]> {
  const venture = await ensureJadeFlowers();
  const rows = await prisma.sku.findMany({
    where: { ventureId: venture.id },
    orderBy: [{ code: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    retailCents: row.retailCents,
    wholesaleCents: row.wholesaleCents,
    eventCents: row.eventCents,
    unitsOnHand: row.unitsOnHand,
    unitsAllocated: row.unitsAllocated,
    availableToSell: row.unitsOnHand - row.unitsAllocated,
    isActive: row.isActive,
  }));
}

export async function createSku(input: z.infer<typeof skuInputSchema>) {
  const venture = await ensureJadeFlowers();
  const retailCents = requiredCents(input.retail, "Retail");
  const wholesaleCents = requiredCents(input.wholesale, "Wholesale");
  const eventCents = requiredCents(input.event, "Event");
  const code = input.code.trim().toUpperCase();

  try {
    return await prisma.sku.create({
      data: {
        ventureId: venture.id,
        code,
        name: input.name,
        retailCents,
        wholesaleCents,
        eventCents,
      },
    });
  } catch {
    throw new Error("That SKU code is already on Jade Flowers.");
  }
}

function requiredCents(raw: string, label: string) {
  const cents = dollarsToCents(raw);
  if (cents == null || cents < 0) throw new Error(`${label} price must be zero or more.`);
  return cents;
}
