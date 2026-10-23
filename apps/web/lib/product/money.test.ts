import assert from "node:assert/strict";
import test from "node:test";

import { costPerUnitCents, projectOrderCents } from "./money";

test("cost per unit rounds half away from zero", () => {
  assert.equal(costPerUnitCents(100, 3), 33);
  assert.equal(costPerUnitCents(101, 2), 51);
  assert.equal(costPerUnitCents(1, 2), 1);
});

test("product confirmed excludes pending refunded and cancelled", () => {
  const totals = projectOrderCents([
    { status: "processing", netAmountCents: 4000 },
    { status: "shipped", netAmountCents: 2500 },
    { status: "delivered", netAmountCents: 1000 },
    { status: "pending", netAmountCents: 900 },
    { status: "refunded", netAmountCents: 500 },
    { status: "cancelled", netAmountCents: 700 },
  ]);
  assert.equal(totals.confirmedCents, 7500);
  assert.equal(totals.potentialCents, 8400);
});
