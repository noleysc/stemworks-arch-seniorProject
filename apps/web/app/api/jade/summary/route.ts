/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { listReorderAlerts } from "@/lib/product/materials";
import { listOrders, productTotals } from "@/lib/product/orders";
import { listSkus } from "@/lib/product/skus";
import { ensureJadeFlowers, JADE_FLOWERS } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export async function GET() {
  const venture = await ensureJadeFlowers();
  const [totals, alerts, orders, skus] = await Promise.all([
    productTotals(),
    listReorderAlerts(),
    listOrders(),
    listSkus(),
  ]);
  const openOrders = orders.filter((order) => order.status === "pending" || order.status === "processing");
  return NextResponse.json({
    tenant: "diaz_ventures",
    venture: {
      key: venture.key,
      name: venture.name,
      prefixCode: venture.prefixCode,
      statusLabel: venture.statusLabel,
      colorToken: JADE_FLOWERS.colorToken,
    },
    header: totals,
    openOrderCount: openOrders.length,
    skuCount: skus.filter((sku) => sku.isActive).length,
    reorderAlerts: alerts.map((material) => ({
      id: material.id,
      name: material.name,
      quantityOnHand: material.quantityOnHand,
      reorderPoint: material.reorderPoint,
      unit: material.unit,
    })),
    topOrders: openOrders.slice(0, 3).map((order) => ({
      code: order.code,
      customerName: order.customerName,
      status: order.status,
      netAmountCents: order.netAmountCents,
      channel: order.channel,
    })),
  });
}
