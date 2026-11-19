/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  appOwnerAllowsPath,
  getAppOwnerDefinition,
  getRole,
  homeForRole,
  isAppRole,
  isPublicPath,
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
  assert.equal(getAppOwnerDefinition("luminary").persona, "Stemworks Owner");
  assert.equal(homeForRole("customer", "pampered_soul"), "/portal?venture=pampered_soul");
  assert.equal(homeForRole("vendor", "luminary"), "/vendor?venture=luminary");
  assert.equal(homeForRole("employee", "diaz_ventures"), "/jade");
});

test("session cookie locks a venture role or grants app ownership", () => {
  assert.equal(parseSessionCookie(undefined).signedIn, false);

  const locked = parseSessionCookie(
    JSON.stringify({
      signedIn: true,
      appOwner: false,
      activeVenture: "diaz_ventures",
      role: "employee",
    }),
  );
  assert.equal(locked.signedIn, true);
  assert.equal(locked.appOwner, false);
  assert.equal(locked.activeVenture, "diaz_ventures");
  assert.equal(locked.role, "employee");

  const owner = parseSessionCookie(
    JSON.stringify({
      signedIn: true,
      appOwner: true,
      activeVenture: "luminary",
      role: "owner",
    }),
  );
  assert.equal(owner.appOwner, true);
  assert.equal(owner.role, "owner");

  // Legacy multi-role / bare-role cookies do not auto-login — show Sign in again
  const legacy = parseSessionCookie(
    JSON.stringify({
      activeVenture: "pampered_soul",
      roles: { luminary: "customer", diaz_ventures: "employee", pampered_soul: "vendor" },
    }),
  );
  assert.equal(legacy.signedIn, false);
  assert.equal(parseSessionCookie("owner").signedIn, false);
});

test("path gates lock venture roles and open all desks for app ownership", () => {
  assert.equal(usesAppShell("/"), false);
  assert.equal(usesAppShell("/e/consent-test-night"), false);
  assert.equal(usesAppShell("/book"), false);
  assert.equal(usesAppShell("/dashboard"), true);
  assert.equal(isPublicPath("/"), true);
  assert.equal(isPublicPath("/luminary"), false);

  assert.equal(roleAllowsPath("customer", "/portal", "pampered_soul"), true);
  assert.equal(roleAllowsPath("customer", "/thepamperedsoul", "pampered_soul"), false);
  assert.equal(roleAllowsPath("vendor", "/vendor", "luminary"), true);
  assert.equal(roleAllowsPath("vendor", "/dashboard", "luminary"), false);

  assert.equal(roleAllowsPath("employee", "/thepamperedsoul/guests", "pampered_soul"), true);
  assert.equal(roleAllowsPath("employee", "/jade/batches", "diaz_ventures"), true);
  assert.equal(roleAllowsPath("employee", "/jade/batches", "pampered_soul"), false);
  assert.equal(roleAllowsPath("owner", "/luminary", "diaz_ventures"), false);

  assert.equal(appOwnerAllowsPath("/luminary"), true);
  assert.equal(appOwnerAllowsPath("/jade/batches"), true);
  assert.equal(appOwnerAllowsPath("/thepamperedsoul/crm"), true);
  assert.equal(appOwnerAllowsPath("/dashboard"), true);
});
