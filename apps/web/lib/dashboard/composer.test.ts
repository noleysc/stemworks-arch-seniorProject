import assert from "node:assert/strict";
import test from "node:test";

import { getTenant, listTenants } from "./registry";

test("the registry exposes three tenants and keeps their ventures apart", () => {
  const tenants = listTenants();
  assert.equal(tenants.length, 3);
  assert.ok(tenants.some((tenant) => tenant.key === "luminary"));
  assert.ok(tenants.some((tenant) => tenant.key === "diaz_ventures"));
  assert.ok(tenants.some((tenant) => tenant.key === "pampered_soul"));

  const luminary = getTenant("luminary");
  const diaz = getTenant("diaz_ventures");
  const pampered = getTenant("pampered_soul");
  assert.ok(luminary);
  assert.ok(diaz);
  assert.ok(pampered);
  assert.equal(luminary!.ventures.length, 3);
  assert.equal(diaz!.ventures.length, 4);
  assert.equal(pampered!.ventures.length, 1);
  assert.equal(pampered!.ventures[0].key, "pampered_events");
  assert.ok(!luminary!.ventures.some((venture) => venture.key === "jade_flowers"));
  assert.ok(!diaz!.ventures.some((venture) => venture.key === "rooms"));
  assert.ok(!diaz!.ventures.some((venture) => venture.key === "pampered_events"));
});
