import assert from "node:assert/strict";
import test from "node:test";

import { getTenant, listTenants } from "./registry";

test("the registry exposes two tenants and keeps their ventures apart", () => {
  const tenants = listTenants();
  assert.equal(tenants.length, 2);
  assert.ok(tenants.some((tenant) => tenant.key === "luminary"));
  assert.ok(tenants.some((tenant) => tenant.key === "diaz_ventures"));

  const luminary = getTenant("luminary");
  const diaz = getTenant("diaz_ventures");
  assert.ok(luminary);
  assert.ok(diaz);
  assert.equal(luminary!.ventures.length, 3);
  assert.equal(diaz!.ventures.length, 4);
  assert.ok(!luminary!.ventures.some((venture) => venture.key === "jade_flowers"));
  assert.ok(!diaz!.ventures.some((venture) => venture.key === "rooms"));
});
