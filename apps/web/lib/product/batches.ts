/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { BATCH_SIZES, batchStatusLabel } from "@/lib/product/catalog";
import { costPerUnitCents } from "@/lib/product/money";
import { prisma } from "@/lib/db";
import { ensureJadeFlowers } from "@/lib/tenancy";

export const createBatchSchema = z.object({
  skuId: z.string().trim().min(1, "Choose a product SKU."),
  unitsPoured: z.coerce
    .number()
    .int()
    .refine((value) => (BATCH_SIZES as readonly number[]).includes(value), {
      message: "Batch size must be 6 or 10.",
    }),
  pouredOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  materials: z
    .array(
      z.object({
        materialId: z.string().trim().min(1),
        quantityUsed: z.coerce.number().int().min(1).max(1_000_000),
      }),
    )
    .min(1, "Add at least one material from stock."),
});

export const releaseBatchSchema = z.object({
  unitsPassedQc: z.coerce.number().int().min(0).max(1_000_000),
  defectReason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const recallBatchSchema = z.object({
  reason: z.string().trim().min(1, "Say why this batch is recalled.").max(500),
});

export type BatchRecord = {
  id: string;
  code: string;
  status: string;
  statusLabel: string;
  pouredOn: string;
  unitsPoured: number;
  unitsPassedQc: number;
  unitsRejected: number;
  yieldPercent: number | null;
  defectReason: string | null;
  notes: string | null;
  recallReason: string | null;
  recalledAt: string | null;
  skuId: string;
  skuCode: string;
  skuName: string;
  materialCostCents: number;
  materials: {
    materialId: string;
    materialName: string;
    quantityUsed: number;
    totalCostCents: number;
    purchaseLots: { purchaseId: string; quantity: number; totalCostCents: number }[];
  }[];
  lineageUnitsRemaining: number;
};

export type RecallPackage = {
  batch: BatchRecord;
  skuUnitsFromBatch: number;
  skuUnitsStillOnHandFromBatch: number;
  message: string;
};

type BatchRow = Prisma.BatchGetPayload<{
  include: { sku: true; materials: true; lineage: true };
}>;

export async function listBatches(): Promise<BatchRecord[]> {
  const venture = await ensureJadeFlowers();
  const rows = await prisma.batch.findMany({
    where: { ventureId: venture.id },
    include: { sku: true, materials: true, lineage: true },
    orderBy: [{ pouredOn: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toRecord);
}

export async function getBatch(batchId: string): Promise<BatchRecord | null> {
  const venture = await ensureJadeFlowers();
  const row = await prisma.batch.findFirst({
    where: { id: batchId, ventureId: venture.id },
    include: { sku: true, materials: true, lineage: true },
  });
  return row ? toRecord(row) : null;
}

/** Consume ordered materials into a pour (sizes 6 or 10). */
export async function createBatch(raw: z.input<typeof createBatchSchema>) {
  const input = createBatchSchema.parse(raw);
  const venture = await ensureJadeFlowers();
  const sku = await prisma.sku.findFirst({
    where: { id: input.skuId, ventureId: venture.id, isActive: true },
  });
  if (!sku) throw new Error("That product SKU is not on Jade Flowers.");

  const materialIds = input.materials.map((row) => row.materialId);
  if (new Set(materialIds).size !== materialIds.length) {
    throw new Error("Each material can only appear once on a batch.");
  }

  const batchId = await prisma.$transaction(async (tx) => {
    const code = await nextBatchCode(tx, venture.id, venture.prefixCode, input.pouredOn);
    const batch = await tx.batch.create({
      data: {
        ventureId: venture.id,
        skuId: sku.id,
        code,
        status: "in_production",
        pouredOn: input.pouredOn,
        unitsPoured: input.unitsPoured,
        notes: emptyToNull(input.notes),
      },
    });

    for (const line of input.materials) {
      const material = await tx.material.findFirst({
        where: { id: line.materialId, ventureId: venture.id, isActive: true },
      });
      if (!material) throw new Error("A material on this batch is not on Jade Flowers.");

      const consumed = await consumeFifo(tx, line.materialId, line.quantityUsed);
      await tx.batchMaterial.create({
        data: {
          batchId: batch.id,
          materialId: material.id,
          materialName: material.name,
          quantityUsed: line.quantityUsed,
          costPerUnitCents: costPerUnitCents(consumed.totalCostCents, line.quantityUsed),
          totalCostCents: consumed.totalCostCents,
          purchaseLotsJson: JSON.stringify(consumed.lots),
        },
      });
      await tx.inventoryMovement.create({
        data: {
          materialId: material.id,
          kind: "batch_consumption",
          quantity: -line.quantityUsed,
          referenceId: batch.id,
          note: `Batch ${code}`,
        },
      });
      await tx.inventoryLevel.update({
        where: { materialId: material.id },
        data: { quantityOnHand: { decrement: line.quantityUsed } },
      });
    }

    return batch.id;
  });

  const created = await getBatch(batchId);
  if (!created) throw new Error("Batch could not be loaded.");
  return created;
}

/** QC release: raise finished-goods inventory and stamp lineage for recall. */
export async function releaseBatch(batchId: string, raw: z.input<typeof releaseBatchSchema>) {
  const input = releaseBatchSchema.parse(raw);
  const venture = await ensureJadeFlowers();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findFirst({
      where: { id: batchId, ventureId: venture.id },
      include: { materials: true, lineage: true },
    });
    if (!batch) throw new Error("Batch not found.");
    if (batch.status === "recalled") throw new Error("A recalled batch cannot be released.");
    if (batch.status === "released" || batch.lineage.length > 0) {
      throw new Error("That batch is already released into inventory.");
    }
    if (input.unitsPassedQc > batch.unitsPoured) {
      throw new Error("Passed units cannot exceed poured units.");
    }
    const rejected = batch.unitsPoured - input.unitsPassedQc;
    if (rejected > 0 && !input.defectReason?.trim()) {
      throw new Error("Add a defect reason when any units fail QC.");
    }

    const materialCost = batch.materials.reduce((sum, row) => sum + row.totalCostCents, 0);
    const cogs = input.unitsPassedQc > 0 ? costPerUnitCents(materialCost, input.unitsPassedQc) : 0;
    const yieldPercent =
      batch.unitsPoured > 0
        ? Math.round((input.unitsPassedQc / batch.unitsPoured) * 10000) / 100
        : null;

    await tx.batch.update({
      where: { id: batch.id },
      data: {
        status: "released",
        unitsPassedQc: input.unitsPassedQc,
        unitsRejected: rejected,
        yieldPercent,
        defectReason: emptyToNull(input.defectReason),
      },
    });

    if (input.unitsPassedQc > 0) {
      await tx.skuBatchLineage.create({
        data: {
          skuId: batch.skuId,
          batchId: batch.id,
          unitsAdded: input.unitsPassedQc,
          unitsRemaining: input.unitsPassedQc,
          cogsPerUnitCents: cogs,
        },
      });
      await tx.sku.update({
        where: { id: batch.skuId },
        data: { unitsOnHand: { increment: input.unitsPassedQc } },
      });
    }
  });

  const released = await getBatch(batchId);
  if (!released) throw new Error("Batch could not be loaded.");
  return released;
}

/** Mark a batch recalled and pull remaining finished units from that pour out of stock. */
export async function recallBatch(batchId: string, raw: z.input<typeof recallBatchSchema>): Promise<RecallPackage> {
  const input = recallBatchSchema.parse(raw);
  const venture = await ensureJadeFlowers();

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findFirst({
      where: { id: batchId, ventureId: venture.id },
      include: { lineage: true, sku: true },
    });
    if (!batch) throw new Error("Batch not found.");
    if (batch.status === "recalled") throw new Error("That batch is already recalled.");

    const remaining = batch.lineage.reduce((sum, row) => sum + row.unitsRemaining, 0);
    const added = batch.lineage.reduce((sum, row) => sum + row.unitsAdded, 0);
    for (const line of batch.lineage) {
      if (line.unitsRemaining > 0) {
        await tx.sku.update({
          where: { id: batch.skuId },
          data: { unitsOnHand: { decrement: line.unitsRemaining } },
        });
        await tx.skuBatchLineage.update({
          where: { id: line.id },
          data: { unitsRemaining: 0 },
        });
      }
    }

    await tx.batch.update({
      where: { id: batch.id },
      data: {
        status: "recalled",
        recalledAt: new Date(),
        recallReason: input.reason.trim(),
      },
    });

    return {
      code: batch.code,
      skuName: batch.sku.name,
      remaining,
      added,
    };
  });

  const batch = await getBatch(batchId);
  if (!batch) throw new Error("Batch could not be loaded.");
  return {
    batch,
    skuUnitsFromBatch: result.added,
    skuUnitsStillOnHandFromBatch: 0,
    message: `Batch ${result.code} recalled. ${result.remaining} finished unit${result.remaining === 1 ? "" : "s"} pulled from ${result.skuName} stock. All units from this pour stay linked under ${result.code}.`,
  };
}

export async function recallPackageForBatch(batchId: string): Promise<RecallPackage> {
  const batch = await getBatch(batchId);
  if (!batch) throw new Error("Batch not found.");
  const lineage = await prisma.skuBatchLineage.findMany({ where: { batchId } });
  const added = lineage.reduce((sum, row) => sum + row.unitsAdded, 0);
  const remaining = lineage.reduce((sum, row) => sum + row.unitsRemaining, 0);
  return {
    batch,
    skuUnitsFromBatch: added,
    skuUnitsStillOnHandFromBatch: remaining,
    message:
      batch.status === "recalled"
        ? `Recalled: ${batch.recallReason ?? "no reason recorded"}.`
        : `Release code ${batch.code} ties ${added} finished unit${added === 1 ? "" : "s"} of ${batch.skuName} to the materials poured on ${batch.pouredOn}.`,
  };
}

async function consumeFifo(tx: Prisma.TransactionClient, materialId: string, quantityNeeded: number) {
  const level = await tx.inventoryLevel.findUnique({ where: { materialId } });
  if (!level || level.quantityOnHand < quantityNeeded) {
    throw new Error("Not enough material on hand for that batch.");
  }

  const purchases = await tx.materialPurchase.findMany({
    where: { materialId, quantityRemaining: { gt: 0 } },
    orderBy: [{ receivedOn: "asc" }, { createdAt: "asc" }],
  });

  let left = quantityNeeded;
  let totalCostCents = 0;
  const lots: { purchaseId: string; quantity: number; totalCostCents: number }[] = [];

  for (const purchase of purchases) {
    if (left <= 0) break;
    const take = Math.min(purchase.quantityRemaining, left);
    const lotCost = Math.round((purchase.totalCostCents * take) / purchase.quantityReceived);
    await tx.materialPurchase.update({
      where: { id: purchase.id },
      data: { quantityRemaining: purchase.quantityRemaining - take },
    });
    lots.push({ purchaseId: purchase.id, quantity: take, totalCostCents: lotCost });
    totalCostCents += lotCost;
    left -= take;
  }

  if (left > 0) throw new Error("Not enough purchase lots left to cover that material draw.");
  return { totalCostCents, lots };
}

async function nextBatchCode(
  tx: Prisma.TransactionClient,
  ventureId: string,
  prefixCode: string,
  pouredOn: string,
) {
  const day = pouredOn.replaceAll("-", "");
  const prefix = `${prefixCode}-C-${day}-`;
  const existing = await tx.batch.count({
    where: { ventureId, code: { startsWith: prefix } },
  });
  return `${prefix}${String(existing + 1).padStart(3, "0")}`;
}

function toRecord(row: BatchRow): BatchRecord {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    statusLabel: batchStatusLabel(row.status),
    pouredOn: row.pouredOn,
    unitsPoured: row.unitsPoured,
    unitsPassedQc: row.unitsPassedQc,
    unitsRejected: row.unitsRejected,
    yieldPercent: row.yieldPercent,
    defectReason: row.defectReason,
    notes: row.notes,
    recallReason: row.recallReason,
    recalledAt: row.recalledAt ? row.recalledAt.toISOString() : null,
    skuId: row.skuId,
    skuCode: row.sku.code,
    skuName: row.sku.name,
    materialCostCents: row.materials.reduce((sum, line) => sum + line.totalCostCents, 0),
    materials: row.materials.map((line) => ({
      materialId: line.materialId,
      materialName: line.materialName,
      quantityUsed: line.quantityUsed,
      totalCostCents: line.totalCostCents,
      purchaseLots: parseLots(line.purchaseLotsJson),
    })),
    lineageUnitsRemaining: row.lineage.reduce((sum, line) => sum + line.unitsRemaining, 0),
  };
}

function parseLots(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { purchaseId: string; quantity: number; totalCostCents: number }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
