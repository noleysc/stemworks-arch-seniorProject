/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { getAppOwnerDefinition, getRole, homeForRole, isAppRole, listRoles, type AppRole } from "@/lib/auth/roles";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
  anonymousSession,
  homeForSession,
  parseSessionCookie,
  roleCookieOptions,
  sessionCookieOptions,
  type DemoSessionState,
} from "@/lib/auth/session";
import { isVentureKey, listVentures, type VentureKey } from "@/lib/auth/ventures";

export const dynamic = "force-dynamic";

function readState(request: Request): DemoSessionState {
  const cookie = request.headers.get("cookie") ?? "";
  const sessionMatch = cookie.match(/(?:^|;\s*)stemworks_session=([^;]*)/);
  const roleMatch = cookie.match(/(?:^|;\s*)stemworks_role=([^;]*)/);
  const raw = sessionMatch?.[1] ? decodeURIComponent(sessionMatch[1]) : roleMatch?.[1];
  return parseSessionCookie(raw);
}

function writeSession(response: NextResponse, state: DemoSessionState) {
  const session = sessionCookieOptions(state);
  response.cookies.set(session.name, session.value, {
    httpOnly: session.httpOnly,
    sameSite: session.sameSite,
    path: session.path,
    maxAge: session.maxAge,
  });
  const legacy = roleCookieOptions(state.appOwner ? "owner" : state.role);
  response.cookies.set(legacy.name, legacy.value, {
    httpOnly: legacy.httpOnly,
    sameSite: legacy.sameSite,
    path: legacy.path,
    maxAge: legacy.maxAge,
  });
}

function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ROLE_COOKIE, "", { path: "/", maxAge: 0 });
}

function sessionPayload(state: DemoSessionState) {
  const definition = state.appOwner
    ? getAppOwnerDefinition(state.activeVenture)
    : getRole(state.role, state.activeVenture);
  return {
    signedIn: state.signedIn,
    appOwner: state.appOwner,
    locked: state.signedIn && !state.appOwner,
    activeVenture: state.activeVenture,
    role: state.role,
    homeHref: homeForSession(state),
    persona: definition.persona,
    ventureName: definition.ventureName,
    label: definition.label,
  };
}

export async function GET(request: Request) {
  const state = readState(request);
  return NextResponse.json({
    ...sessionPayload(state),
    ventures: listVentures(),
    roles: listRoles(state.activeVenture).map((item) => ({
      key: item.key,
      label: item.label,
      summary: item.summary,
      homeHref: item.homeHref,
      kernelHint: item.kernelHint,
      persona: item.persona,
      ventureName: item.ventureName,
    })),
  });
}

type Body = {
  action?: string;
  role?: string;
  venture?: string;
  activeVenture?: string;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Send a JSON body with an action." }, { status: 400 });
  }

  const state = readState(request);
  const action = body.action ?? (body.role || body.venture ? "login" : undefined);

  if (action === "logout") {
    const response = NextResponse.json({ ok: true, homeHref: "/" });
    clearSession(response);
    return response;
  }

  if (action === "login_app_owner") {
    const venture: VentureKey = isVentureKey(body.venture ?? body.activeVenture)
      ? ((body.venture ?? body.activeVenture) as VentureKey)
      : "luminary";
    const next: DemoSessionState = {
      signedIn: true,
      appOwner: true,
      activeVenture: venture,
      role: "owner",
    };
    const response = NextResponse.json(sessionPayload(next));
    writeSession(response, next);
    return response;
  }

  if (action === "switch_venture") {
    if (!state.signedIn || !state.appOwner) {
      return NextResponse.json({ error: "Only Stemworks app ownership can switch ventures." }, { status: 403 });
    }
    if (!isVentureKey(body.venture ?? body.activeVenture)) {
      return NextResponse.json({ error: "Choose a venture." }, { status: 400 });
    }
    const nextVenture = (body.venture ?? body.activeVenture) as VentureKey;
    const next: DemoSessionState = {
      ...state,
      activeVenture: nextVenture,
      role: "owner",
    };
    const response = NextResponse.json({
      ...sessionPayload(next),
      homeHref: listVentures().find((item) => item.key === nextVenture)?.deskHref ?? "/",
    });
    writeSession(response, next);
    return response;
  }

  if (action === "login") {
    if (!isVentureKey(body.venture ?? body.activeVenture)) {
      return NextResponse.json({ error: "Choose a venture first." }, { status: 400 });
    }
    if (!isAppRole(body.role)) {
      return NextResponse.json({ error: "Choose owner, employee, customer, or vendor." }, { status: 400 });
    }
    const venture = (body.venture ?? body.activeVenture) as VentureKey;
    const role = body.role as AppRole;
    const next: DemoSessionState = {
      signedIn: true,
      appOwner: false,
      activeVenture: venture,
      role,
    };
    const response = NextResponse.json({
      ...sessionPayload(next),
      homeHref: homeForRole(role, venture),
    });
    writeSession(response, next);
    return response;
  }

  return NextResponse.json(
    { error: "Use action login, login_app_owner, switch_venture, or logout." },
    { status: 400 },
  );
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, homeHref: "/" });
  clearSession(response);
  return response;
}
