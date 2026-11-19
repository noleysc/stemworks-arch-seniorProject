/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { cookies } from "next/headers";

import {
  DEFAULT_ROLE,
  DEFAULT_VENTURE,
  ROLE_COOKIE,
  SESSION_COOKIE,
  getAppOwnerDefinition,
  getRole,
  isAppRole,
  type AppRole,
  type RoleDefinition,
} from "@/lib/auth/roles";
import { isVentureKey, type VentureKey } from "@/lib/auth/ventures";

export { ROLE_COOKIE, SESSION_COOKIE };

/**
 * Demo auth state.
 * - signedIn false → login gate only
 * - appOwner true → Stemworks ownership; can view every venture
 * - otherwise locked to activeVenture + role until sign-out
 */
export type DemoSessionState = {
  signedIn: boolean;
  appOwner: boolean;
  activeVenture: VentureKey;
  role: AppRole;
};

export type DemoSession = DemoSessionState & {
  locked: boolean;
  definition: RoleDefinition;
};

export function anonymousSession(): DemoSessionState {
  return {
    signedIn: false,
    appOwner: false,
    activeVenture: DEFAULT_VENTURE,
    role: DEFAULT_ROLE,
  };
}

export function parseSessionCookie(raw: string | undefined): DemoSessionState {
  if (!raw) return anonymousSession();
  try {
    const parsed = JSON.parse(raw) as {
      signedIn?: boolean;
      appOwner?: boolean;
      activeVenture?: string;
      role?: string;
      roles?: Record<string, string>;
    };

    // Pre-lock cookies (roles map / bare role string) must not auto-enter a desk —
    // send people through the Sign in gate again.
    if (parsed.signedIn !== true && parsed.appOwner !== true) {
      return anonymousSession();
    }

    const activeVenture = isVentureKey(parsed.activeVenture) ? parsed.activeVenture : DEFAULT_VENTURE;
    const role = isAppRole(parsed.role) ? parsed.role : DEFAULT_ROLE;
    const appOwner = parsed.appOwner === true;
    const signedIn = parsed.signedIn === true || appOwner;

    return {
      signedIn,
      appOwner,
      activeVenture,
      role: appOwner ? "owner" : role,
    };
  } catch {
    // Legacy bare role cookie (e.g. stemworks_role=owner) → not signed in
    return anonymousSession();
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
  const definition = state.appOwner
    ? getAppOwnerDefinition(state.activeVenture)
    : getRole(state.role, state.activeVenture);
  return {
    ...state,
    locked: state.signedIn && !state.appOwner,
    definition,
  };
}

export function sessionCookieOptions(state: DemoSessionState) {
  return {
    name: SESSION_COOKIE,
    value: JSON.stringify({
      signedIn: state.signedIn,
      appOwner: state.appOwner,
      activeVenture: state.activeVenture,
      role: state.appOwner ? "owner" : state.role,
    }),
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
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

export function homeForSession(state: DemoSessionState): string {
  if (!state.signedIn) return "/login";
  if (state.appOwner) return "/";
  return getRole(state.role, state.activeVenture).homeHref;
}
