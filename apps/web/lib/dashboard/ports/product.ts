/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { VenturePortResult } from "@/lib/dashboard/types";
import { channelLabel, statusLabel } from "@/lib/product/catalog";
import { listReorderAlerts } from "@/lib/product/materials";
import { listOrders, productTotals } from "@/lib/product/orders";
import { ensureJadeFlowers } from "@/lib/tenancy";

export async function productPort(businessDate: string): Promise<VenturePortResult> {
  await ensureJadeFlowers();
  const [totals, orders, alerts] = await Promise.all([productTotals(), listOrders(), listReorderAlerts()]);
  const open = orders.filter((order) => order.status === "pending" || order.status === "processing");

  const topItems = [...open]
    .sort((a, b) => b.netAmountCents - a.netAmountCents || a.code.localeCompare(b.code))
    .slice(0, 3)
    .map((order) => ({
      label: `${order.code} · ${order.customerName}`,
      stage: statusLabel(order.status),
      valueCents: order.netAmountCents,
      kind: order.channel,
    }));

  const attention = alerts.map((material) => ({
    type: "inventory_low" as const,
    body: `${material.name} is at ${material.quantityOnHand} ${material.unit} · reorder at ${material.reorderPoint}`,
    venture: "jade_flowers",
  }));

  const milestones = open.slice(0, 12).map((order) => ({
    id: order.id,
    venture: "jade_flowers",
    title: `${order.code} · ${channelLabel(order.channel)}`,
    dueOn: businessDate,
    kind: "pipeline_deadline" as const,
    colorToken: "jade",
  }));

  return {
    confirmedCents: totals.confirmedCents,
    potentialCents: totals.potentialCents,
    openCount: open.length,
    hasCurrentActivity: open.length > 0 || alerts.length > 0,
    statusLabel: "Active revenue",
    topItems,
    attention,
    milestones,
    detailHref: "/jade/orders",
  };
}

export async function placeholderPort(statusLabel: string, detailHref: string): Promise<VenturePortResult> {
  return {
    confirmedCents: 0,
    potentialCents: 0,
    openCount: 0,
    hasCurrentActivity: false,
    statusLabel,
    topItems: [],
    attention: [],
    milestones: [],
    detailHref,
  };
}
