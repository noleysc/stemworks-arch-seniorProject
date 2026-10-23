/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from "@/lib/product/catalog";
import { costPerUnitCents } from "@/lib/product/money";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";
import { ensureJadeFlowers } from "@/lib/tenancy";

const categoryKeys = MATERIAL_CATEGORIES.map((item) => item.key) as [string, ...string[]];
const unitKeys = MATERIAL_UNITS.map((item) => item.key) as [string, ...string[]];

export const materialInputSchema = z.object({
  name: z.string().trim().min(1, "Material name is required.").max(160),
  category: z.enum(categoryKeys),
  unit: z.enum(unitKeys),
  supplier: z.string().trim().max(160).optional().or(z.literal("")),
  supplierSku: z.string().trim().max(80).optional().or(z.literal("")),
  reorderPoint: z.coerce.number().int().min(0).max(1_000_000),
  leadTimeDays: z.coerce.number().int().min(0).max(365),
});

export const purchaseInputSchema = z.object({
  receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real date."),
  quantityReceived: z.coerce.number().int().min(1).max(1_000_000),
  totalCost: z.string().trim().min(1, "Total cost is required."),
  supplierOrderRef: z.string().trim().max(120).optional().or(z.literal("")),
});

export type MaterialRecord = {
  id: string;
  name: string;
  category: string;
  unit: string;
  supplier: string | null;
  supplierSku: string | null;
  reorderPoint: number;
  leadTimeDays: number;
  isActive: boolean;
  quantityOnHand: number;
  belowReorder: boolean;
};

export async function listMaterials(): Promise<MaterialRecord[]> {
  const venture = await ensureJadeFlowers();
  const rows = await prisma.material.findMany({
    where: { ventureId: venture.id },
    include: { level: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => {
    const quantityOnHand = row.level?.quantityOnHand ?? 0;
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      unit: row.unit,
      supplier: row.supplier,
      supplierSku: row.supplierSku,
      reorderPoint: row.reorderPoint,
      leadTimeDays: row.leadTimeDays,
      isActive: row.isActive,
      quantityOnHand,
      belowReorder: quantityOnHand <= row.reorderPoint,
    };
  });
}

export async function createMaterial(input: z.infer<typeof materialInputSchema>) {
  const venture = await ensureJadeFlowers();
  return prisma.$transaction(async (tx) => {
    const material = await tx.material.create({
      data: {
        ventureId: venture.id,
        name: input.name,
        category: input.category,
        unit: input.unit,
        supplier: emptyToNull(input.supplier),
        supplierSku: emptyToNull(input.supplierSku),
        reorderPoint: input.reorderPoint,
        leadTimeDays: input.leadTimeDays,
      },
    });
    await tx.inventoryLevel.create({ data: { materialId: material.id, quantityOnHand: 0 } });
    return material;
  });
}

export async function receivePurchase(materialId: string, input: z.infer<typeof purchaseInputSchema>) {
  const venture = await ensureJadeFlowers();
  const material = await prisma.material.findFirst({ where: { id: materialId, ventureId: venture.id } });
  if (!material) throw new Error("That material is not on Jade Flowers.");

  const totalCostCents = dollarsToCents(input.totalCost);
  if (totalCostCents == null || totalCostCents < 0) throw new Error("Total cost must be zero or more.");
  const perUnit = costPerUnitCents(totalCostCents, input.quantityReceived);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.materialPurchase.create({
      data: {
        materialId,
        receivedOn: input.receivedOn,
        quantityReceived: input.quantityReceived,
        quantityRemaining: input.quantityReceived,
        totalCostCents,
        costPerUnitCents: perUnit,
        supplierOrderRef: emptyToNull(input.supplierOrderRef),
      },
    });
    await tx.inventoryMovement.create({
      data: {
        materialId,
        kind: "purchase_receipt",
        quantity: input.quantityReceived,
        referenceId: purchase.id,
      },
    });
    await tx.inventoryLevel.upsert({
      where: { materialId },
      update: { quantityOnHand: { increment: input.quantityReceived } },
      create: { materialId, quantityOnHand: input.quantityReceived },
    });
    return purchase;
  });
}

export async function listReorderAlerts() {
  const materials = await listMaterials();
  return materials.filter((material) => material.isActive && material.belowReorder);
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
