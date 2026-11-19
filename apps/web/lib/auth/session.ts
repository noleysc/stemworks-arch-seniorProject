/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { cookies } from "next/headers";

import {
  DEFAULT_ROLE,
  DEFAULT_VENTURE,
  ROLE_COOKIE,
  SESSION_COOKIE,
  getRole,
  isAppRole,
  type AppRole,
  type RoleDefinition,
} from "@/lib/auth/roles";
import { VENTURE_KEYS, isVentureKey, type VentureKey } from "@/lib/auth/ventures";

export { ROLE_COOKIE, SESSION_COOKIE };

export type DemoSessionState = {
  activeVenture: VentureKey;
  roles: Record<VentureKey, AppRole>;
};

export type DemoSession = DemoSessionState & {
  role: AppRole;
  definition: RoleDefinition;
};

function defaultRoles(): Record<VentureKey, AppRole> {
  return {
    luminary: DEFAULT_ROLE,
    diaz_ventures: DEFAULT_ROLE,
    pampered_soul: DEFAULT_ROLE,
  };
}

export function parseSessionCookie(raw: string | undefined): DemoSessionState {
  const roles = defaultRoles();
  if (!raw) {
    return { activeVenture: DEFAULT_VENTURE, roles };
  }
  try {
    const parsed = JSON.parse(raw) as {
      activeVenture?: string;
      roles?: Record<string, string>;
      role?: string;
    };
    const activeVenture = isVentureKey(parsed.activeVenture) ? parsed.activeVenture : DEFAULT_VENTURE;
    for (const key of VENTURE_KEYS) {
      const value = parsed.roles?.[key];
      if (isAppRole(value)) roles[key] = value;
    }
    // Legacy single-role cookie body support
    if (isAppRole(parsed.role) && !parsed.roles) {
      for (const key of VENTURE_KEYS) roles[key] = parsed.role;
    }
    return { activeVenture, roles };
  } catch {
    if (isAppRole(raw)) {
      const roles = defaultRoles();
      for (const key of VENTURE_KEYS) roles[key] = raw;
      return { activeVenture: DEFAULT_VENTURE, roles };
    }
    return { activeVenture: DEFAULT_VENTURE, roles };
  }
}

export function readSessionFromCookieStore(store: {
  get: (name: string) => { value: string } | undefined;
}): DemoSessionState {
  const sessionRaw = store.get(SESSION_COOKIE)?.value;
  if (sessionRaw) return parseSessionCookie(sessionRaw);
  const legacy = store.get(ROLE_COOKIE)?.value;
  return parseSessionCookie(legacy);
}

export function getDemoSession(): DemoSession {
  const state = readSessionFromCookieStore(cookies());
  const role = state.roles[state.activeVenture];
  return {
    ...state,
    role,
    definition: getRole(role, state.activeVenture),
  };
}

export function sessionCookieOptions(state: DemoSessionState) {
  return {
    name: SESSION_COOKIE,
    value: JSON.stringify(state),
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function roleCookieOptions(role: AppRole) {
  // Keep legacy cookie in sync for older readers.
  return {
    name: ROLE_COOKIE,
    value: role,
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
