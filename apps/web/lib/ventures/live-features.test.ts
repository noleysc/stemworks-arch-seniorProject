/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { emptyBlueprint, seedBlueprints } from "@/lib/ventures/blueprint";
import {
  deskHrefForBlueprint,
  featureRequirementForPath,
  featuresForVenture,
  filterNavByFeatures,
  linkedVentureForBlueprint,
  pathAllowedByFeatures,
  snapshotFromBlueprints,
} from "@/lib/ventures/live-features";

test("seed blueprints link to live desks", () => {
  const [luminary, jade, pampered] = seedBlueprints();
  assert.equal(linkedVentureForBlueprint(luminary), "luminary");
  assert.equal(deskHrefForBlueprint(luminary), "/luminary");
  assert.equal(deskHrefForBlueprint(jade), "/jade");
  assert.equal(deskHrefForBlueprint(pampered), "/thepamperedsoul");
  assert.equal(deskHrefForBlueprint(emptyBlueprint({ id: "bp_custom" })), "/v/bp_custom");
});

test("disabling hotel blocks luminary paths", () => {
  const blueprints = seedBlueprints().map((item) =>
    item.id === "bp_luminary" ? { ...item, features: ["connect"] } : item,
  );
  const snapshot = snapshotFromBlueprints(blueprints);
  assert.equal(pathAllowedByFeatures("/luminary", "luminary", snapshot), false);
  assert.equal(pathAllowedByFeatures("/luminary/rooms", "luminary", snapshot), false);
  assert.equal(pathAllowedByFeatures("/jade", "diaz_ventures", snapshot), true);
});

test("empty feature list does not fall open to defaults", () => {
  const snapshot = snapshotFromBlueprints(
    seedBlueprints().map((item) => (item.id === "bp_pampered" ? { ...item, features: [] } : item)),
  );
  assert.deepEqual(featuresForVenture(snapshot, "pampered_soul"), []);
  assert.equal(pathAllowedByFeatures("/thepamperedsoul/bookings", "pampered_soul", snapshot), false);
  assert.equal(pathAllowedByFeatures("/book", "pampered_soul", snapshot), false);
});

test("null snapshot uses defaults", () => {
  assert.equal(pathAllowedByFeatures("/luminary", "luminary", null), true);
  assert.equal(featureRequirementForPath("/thepamperedsoul/crm"), "crm_consent");
  assert.deepEqual(featureRequirementForPath("/thepamperedsoul/calendar"), [
    "spa_bookings",
    "ticketed_events",
  ]);
});

test("nav filter uses per-path venture features when snapshot is present", () => {
  const blueprints = seedBlueprints().map((item) =>
    item.id === "bp_luminary" ? { ...item, features: [] } : item,
  );
  const snapshot = snapshotFromBlueprints(blueprints);
  const nav = [
    { href: "/", label: "All desks", description: "" },
    { href: "/organize", label: "Organize", description: "" },
    { href: "/luminary", label: "Luminary", description: "" },
    { href: "/jade", label: "Jade", description: "" },
    { href: "/thepamperedsoul", label: "Pampered", description: "" },
  ];
  const filtered = filterNavByFeatures(nav, featuresForVenture(snapshot, "pampered_soul"), snapshot);
  assert.deepEqual(
    filtered.map((item) => item.href),
    ["/", "/organize", "/jade", "/thepamperedsoul"],
  );
});
