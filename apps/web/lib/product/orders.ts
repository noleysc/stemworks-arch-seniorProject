/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { ORDER_CHANNELS, ORDER_STATUSES } from "@/lib/product/catalog";
import { projectOrderCents } from "@/lib/product/money";
import { prisma } from "@/lib/db";
import { ensureJadeFlowers } from "@/lib/tenancy";

const channelKeys = ORDER_CHANNELS.map((item) => item.key) as [string, ...string[]];
const statusKeys = ORDER_STATUSES.map((item) => item.key) as [string, ...string[]];

export const orderInputSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required.").max(160),
  channel: z.enum(channelKeys),
  status: z.enum(statusKeys).default("pending"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(10_000),
        unitPriceCents: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Add at least one line."),
});

export type OrderRecord = {
  id: string;
  code: string;
  customerName: string;
  channel: string;
  status: string;
  netAmountCents: number;
  notes: string | null;
  createdAt: string;
  lines: { skuCode: string; skuName: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
};

export async function listOrders(): Promise<OrderRecord[]> {
  const venture = await ensureJadeFlowers();
  const rows = await prisma.order.findMany({
    where: { ventureId: venture.id },
    include: { lineItems: { include: { sku: true } } },
    orderBy: [{ createdAt: "desc" }],
  });
  return rows.map(toRecord);
}

export async function createOrder(input: z.infer<typeof orderInputSchema>) {
  const venture = await ensureJadeFlowers();
  const skuIds = input.lines.map((line) => line.skuId);
  const skus = await prisma.sku.findMany({ where: { ventureId: venture.id, id: { in: skuIds } } });
  if (skus.length !== new Set(skuIds).size) {
    throw new Error("Every line must use a Jade Flowers SKU.");
  }

  const netAmountCents = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  const year = new Date().getUTCFullYear();
  const code = await nextOrderCode(venture.id, venture.prefixCode, year);

  return prisma.order.create({
    data: {
      ventureId: venture.id,
      code,
      customerName: input.customerName,
      channel: input.channel,
      status: input.status,
      netAmountCents,
      notes: emptyToNull(input.notes),
      lineItems: {
        create: input.lines.map((line) => ({
          skuId: line.skuId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.quantity * line.unitPriceCents,
        })),
      },
    },
    include: { lineItems: { include: { sku: true } } },
  });
}

export async function updateOrderStatus(id: string, status: string) {
  if (!statusKeys.includes(status)) throw new Error("Unknown status.");
  const venture = await ensureJadeFlowers();
  const existing = await prisma.order.findFirst({ where: { id, ventureId: venture.id } });
  if (!existing) throw new Error("That order is not on Jade Flowers.");
  return prisma.order.update({ where: { id }, data: { status } });
}

export async function productTotals() {
  const venture = await ensureJadeFlowers();
  const orders = await prisma.order.findMany({
    where: { ventureId: venture.id },
    select: { status: true, netAmountCents: true },
  });
  return projectOrderCents(orders);
}

async function nextOrderCode(ventureId: string, prefix: string, year: number) {
  const marker = `${prefix}-ORD-${year}-`;
  const latest = await prisma.order.findFirst({
    where: { ventureId, code: { startsWith: marker } },
    orderBy: { code: "desc" },
  });
  const next = latest ? Number(latest.code.slice(marker.length)) + 1 : 1;
  if (!Number.isFinite(next) || next < 1) {
    return `${marker}${String(1).padStart(4, "0")}`;
  }
  return `${marker}${String(next).padStart(4, "0")}`;
}

function toRecord(row: {
  id: string;
  code: string;
  customerName: string;
  channel: string;
  status: string;
  netAmountCents: number;
  notes: string | null;
  createdAt: Date;
  lineItems: { quantity: number; unitPriceCents: number; lineTotalCents: number; sku: { code: string; name: string } }[];
}): OrderRecord {
  return {
    id: row.id,
    code: row.code,
    customerName: row.customerName,
    channel: row.channel,
    status: row.status,
    netAmountCents: row.netAmountCents,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    lines: row.lineItems.map((line) => ({
      skuCode: line.sku.code,
      skuName: line.sku.name,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
    })),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
