/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addMetric,
  normalizeFeatures,
  normalizeMetricOrder,
  removeMetric,
  reorderMetrics,
  toggleFeature,
  validateBlueprintInput,
} from "@/lib/ventures/blueprint";

test("metric order normalizes unknowns and preserves unique order", () => {
  assert.deepEqual(normalizeMetricOrder(["confirmed", "bogus", "potential", "confirmed"]), [
    "confirmed",
    "potential",
  ]);
  assert.deepEqual(reorderMetrics(["confirmed", "potential", "gap"], 2, 0), [
    "gap",
    "confirmed",
    "potential",
  ]);
  assert.deepEqual(addMetric(["confirmed"], "inventory"), ["confirmed", "inventory"]);
  assert.deepEqual(removeMetric(["confirmed", "potential"], "confirmed"), ["potential"]);
});

test("feature checkboxes toggle without duplicates", () => {
  assert.deepEqual(toggleFeature(["hotel"], "product", true), ["hotel", "product"]);
  assert.deepEqual(toggleFeature(["hotel", "product"], "hotel", false), ["product"]);
  assert.deepEqual(normalizeFeatures(["hotel", "hotel", "nope"]), ["hotel"]);
});

test("blueprint validation rejects empty names", () => {
  const bad = validateBlueprintInput({ name: " " });
  assert.equal(bad.ok, false);
  const good = validateBlueprintInput({ name: "Coastal Atelier", features: ["atelier", "product"] });
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(good.value.name, "Coastal Atelier");
    assert.deepEqual(good.value.features, ["atelier", "product"]);
  }
});
