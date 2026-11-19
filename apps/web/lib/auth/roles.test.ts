/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getRole,
  homeForRole,
  isAppRole,
  roleAllowsPath,
  usesAppShell,
} from "@/lib/auth/roles";
import { parseSessionCookie } from "@/lib/auth/session";

test("demo roles map to product language per venture", () => {
  assert.equal(isAppRole("owner"), true);
  assert.equal(isAppRole("employee"), true);
  assert.equal(isAppRole("customer"), true);
  assert.equal(isAppRole("vendor"), true);
  assert.equal(isAppRole("manager"), false);
  assert.equal(getRole("employee", "pampered_soul").canSeeMoney, false);
  assert.equal(getRole("owner", "luminary").canSeeMoney, true);
  assert.equal(getRole("owner", "luminary").persona, "Alex Rivera");
  assert.equal(getRole("owner", "pampered_soul").persona, "Morgan Spa");
  assert.equal(getRole("vendor", "diaz_ventures").persona, "Wax & Wick Supply");
  assert.equal(homeForRole("customer", "pampered_soul"), "/portal?venture=pampered_soul");
  assert.equal(homeForRole("vendor", "luminary"), "/vendor?venture=luminary");
  assert.equal(homeForRole("employee", "diaz_ventures"), "/jade");
});

test("session cookie keeps a distinct role per venture", () => {
  const state = parseSessionCookie(
    JSON.stringify({
      activeVenture: "jade",
      roles: { luminary: "owner", diaz_ventures: "employee", pampered_soul: "vendor" },
    }),
  );
  // invalid activeVenture falls back
  assert.equal(state.activeVenture, "pampered_soul");
  const ok = parseSessionCookie(
    JSON.stringify({
      activeVenture: "diaz_ventures",
      roles: { luminary: "customer", diaz_ventures: "employee", pampered_soul: "vendor" },
    }),
  );
  assert.equal(ok.activeVenture, "diaz_ventures");
  assert.equal(ok.roles.luminary, "customer");
  assert.equal(ok.roles.diaz_ventures, "employee");
  assert.equal(ok.roles.pampered_soul, "vendor");
});

test("shell and path gates keep roles inside their venture", () => {
  assert.equal(usesAppShell("/e/consent-test-night"), false);
  assert.equal(usesAppShell("/book"), false);
  assert.equal(usesAppShell("/dashboard"), true);
  assert.equal(usesAppShell("/portal"), true);
  assert.equal(usesAppShell("/luminary"), true);
  assert.equal(usesAppShell("/jade"), true);
  assert.equal(usesAppShell("/thepamperedsoul"), true);

  assert.equal(roleAllowsPath("customer", "/portal", "pampered_soul"), true);
  assert.equal(roleAllowsPath("customer", "/thepamperedsoul", "pampered_soul"), false);
  assert.equal(roleAllowsPath("vendor", "/vendor", "luminary"), true);
  assert.equal(roleAllowsPath("vendor", "/dashboard", "luminary"), false);

  assert.equal(roleAllowsPath("employee", "/thepamperedsoul/guests", "pampered_soul"), true);
  assert.equal(roleAllowsPath("employee", "/jade/batches", "diaz_ventures"), true);
  assert.equal(roleAllowsPath("employee", "/jade/batches", "pampered_soul"), false);
  assert.equal(roleAllowsPath("employee", "/luminary/rooms", "luminary"), true);
  assert.equal(roleAllowsPath("employee", "/thepamperedsoul/new", "pampered_soul"), false);
  assert.equal(roleAllowsPath("employee", "/thepamperedsoul/crm", "pampered_soul"), false);

  assert.equal(roleAllowsPath("owner", "/luminary", "diaz_ventures"), false);
  assert.equal(roleAllowsPath("owner", "/jade", "diaz_ventures"), true);
});
