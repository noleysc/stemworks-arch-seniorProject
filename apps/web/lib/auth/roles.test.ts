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

test("demo roles map to product language", () => {
  assert.equal(isAppRole("owner"), true);
  assert.equal(isAppRole("employee"), true);
  assert.equal(isAppRole("customer"), true);
  assert.equal(isAppRole("vendor"), true);
  assert.equal(isAppRole("manager"), false);
  assert.equal(getRole("employee").canSeeMoney, false);
  assert.equal(getRole("owner").canSeeMoney, true);
  assert.equal(homeForRole("customer"), "/portal");
  assert.equal(homeForRole("vendor"), "/vendor");
});

test("shell and path gates keep guest checkout free of owner chrome", () => {
  assert.equal(usesAppShell("/e/consent-test-night"), false);
  assert.equal(usesAppShell("/book"), false);
  assert.equal(usesAppShell("/dashboard"), true);
  assert.equal(usesAppShell("/portal"), true);
  assert.equal(roleAllowsPath("customer", "/portal"), true);
  assert.equal(roleAllowsPath("customer", "/experiences"), false);
  assert.equal(roleAllowsPath("vendor", "/vendor"), true);
  assert.equal(roleAllowsPath("vendor", "/dashboard"), false);
  assert.equal(roleAllowsPath("employee", "/experiences/guests"), true);
  assert.equal(roleAllowsPath("employee", "/jade/batches"), true);
  assert.equal(roleAllowsPath("employee", "/experiences/new"), false);
  assert.equal(roleAllowsPath("employee", "/experiences/crm"), false);
});
