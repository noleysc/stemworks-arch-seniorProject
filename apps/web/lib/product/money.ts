/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/** Half away from zero to the nearest cent, matching the product cost rule. */
export function costPerUnitCents(totalCostCents: number, quantityReceived: number): number {
  if (quantityReceived <= 0) throw new Error("Quantity received must be at least 1.");
  const raw = totalCostCents / quantityReceived;
  return Math.sign(raw) * Math.round(Math.abs(raw));
}

export function projectOrderCents(orders: { status: string; netAmountCents: number }[]) {
  const confirmed = orders
    .filter((order) => order.status === "processing" || order.status === "shipped" || order.status === "delivered")
    .reduce((sum, order) => sum + order.netAmountCents, 0);
  const pending = orders
    .filter((order) => order.status === "pending")
    .reduce((sum, order) => sum + order.netAmountCents, 0);
  return {
    confirmedCents: confirmed,
    potentialCents: confirmed + pending,
  };
}
