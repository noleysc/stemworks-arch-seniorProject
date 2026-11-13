/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { createBatch, listBatches, recallBatch, releaseBatch } from "@/lib/product/batches";
import { prisma } from "@/lib/db";
import { createMaterial, receivePurchase } from "@/lib/product/materials";
import { createSku, listSkus } from "@/lib/product/skus";
import { ensureJadeFlowers } from "@/lib/tenancy";

async function seedBeeswaxFlow() {
  const venture = await ensureJadeFlowers();
  const stamp = Date.now().toString(36);
  const material = await createMaterial({
    name: `Beeswax ${stamp}`,
    category: "wax",
    unit: "lb",
    supplier: "Test Apiary",
    supplierSku: `BW-${stamp}`,
    reorderPoint: 2,
    leadTimeDays: 5,
  });
  await receivePurchase(material.id, {
    receivedOn: "2026-11-01",
    quantityReceived: 20,
    totalCost: "40.00",
    supplierOrderRef: `PO-${stamp}`,
  });
  const sku = await createSku({
    code: `CNDL-${stamp}`,
    name: `Honey Candle ${stamp}`,
    retail: "28.00",
    wholesale: "18.00",
    event: "24.00",
  });
  return { venture, material, sku, stamp };
}

async function cleanup(stamp: string, materialId: string, skuId: string) {
  const batches = await prisma.batch.findMany({
    where: { skuId },
    select: { id: true },
  });
  const batchIds = batches.map((row) => row.id);
  if (batchIds.length > 0) {
    await prisma.skuBatchLineage.deleteMany({ where: { batchId: { in: batchIds } } });
    await prisma.batchMaterial.deleteMany({ where: { batchId: { in: batchIds } } });
    await prisma.inventoryMovement.deleteMany({ where: { referenceId: { in: batchIds } } });
    await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
  }
  await prisma.inventoryMovement.deleteMany({ where: { materialId } });
  await prisma.materialPurchase.deleteMany({ where: { materialId } });
  await prisma.inventoryLevel.deleteMany({ where: { materialId } });
  await prisma.material.delete({ where: { id: materialId } });
  await prisma.orderLineItem.deleteMany({ where: { skuId } });
  await prisma.sku.delete({ where: { id: skuId } });
  void stamp;
}

test("order material, pour batch of 6, release inventory, and recall by batch code", async () => {
  const { material, sku, stamp } = await seedBeeswaxFlow();

  try {
    const batch = await createBatch({
      skuId: sku.id,
      unitsPoured: 6,
      pouredOn: "2026-11-13",
      notes: "Pilot pour",
      materials: [{ materialId: material.id, quantityUsed: 3 }],
    });

    assert.match(batch.code, /^JF-C-20261113-\d{3}$/);
    assert.equal(batch.unitsPoured, 6);
    assert.equal(batch.status, "in_production");
    assert.equal(batch.materials[0]?.materialName.includes("Beeswax"), true);

    const levelAfterPour = await prisma.inventoryLevel.findUniqueOrThrow({ where: { materialId: material.id } });
    assert.equal(levelAfterPour.quantityOnHand, 17);

    const released = await releaseBatch(batch.id, { unitsPassedQc: 6, defectReason: "" });
    assert.equal(released.status, "released");
    assert.equal(released.unitsPassedQc, 6);
    assert.equal(released.lineageUnitsRemaining, 6);

    const skus = await listSkus();
    const updated = skus.find((row) => row.id === sku.id);
    assert.ok(updated);
    assert.equal(updated.unitsOnHand, 6);

    const recalled = await recallBatch(batch.id, { reason: "Wick defect reported on linked units." });
    assert.equal(recalled.batch.status, "recalled");
    assert.equal(recalled.skuUnitsStillOnHandFromBatch, 0);

    const afterRecall = (await listSkus()).find((row) => row.id === sku.id);
    assert.equal(afterRecall?.unitsOnHand, 0);

    const listed = await listBatches();
    assert.ok(listed.some((row) => row.id === batch.id && row.status === "recalled"));
  } finally {
    await cleanup(stamp, material.id, sku.id);
  }
});

test("batch size must be 6 or 10 and stock must cover the pour", async () => {
  const { material, sku, stamp } = await seedBeeswaxFlow();
  try {
    await assert.rejects(
      () =>
        createBatch({
          skuId: sku.id,
          unitsPoured: 8,
          pouredOn: "2026-11-13",
          materials: [{ materialId: material.id, quantityUsed: 1 }],
        }),
      /6 or 10/i,
    );
    await assert.rejects(
      () =>
        createBatch({
          skuId: sku.id,
          unitsPoured: 10,
          pouredOn: "2026-11-13",
          materials: [{ materialId: material.id, quantityUsed: 50 }],
        }),
      /not enough material/i,
    );
  } finally {
    await cleanup(stamp, material.id, sku.id);
  }
});
