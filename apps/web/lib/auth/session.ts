/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { cookies } from "next/headers";

import {
  DEFAULT_ROLE,
  ROLE_COOKIE,
  isAppRole,
  type AppRole,
  getRole,
  type RoleDefinition,
} from "@/lib/auth/roles";

export { ROLE_COOKIE };

export function readRoleFromCookieStore(store: { get: (name: string) => { value: string } | undefined }): AppRole {
  const raw = store.get(ROLE_COOKIE)?.value;
  return isAppRole(raw) ? raw : DEFAULT_ROLE;
}

export function getDemoSession(): { role: AppRole; definition: RoleDefinition } {
  const role = readRoleFromCookieStore(cookies());
  return { role, definition: getRole(role) };
}

export function roleCookieOptions(role: AppRole) {
  return {
    name: ROLE_COOKIE,
    value: role,
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
