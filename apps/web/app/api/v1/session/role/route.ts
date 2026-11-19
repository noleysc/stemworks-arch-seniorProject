/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { getRole, homeForRole, isAppRole, listRoles, type AppRole } from "@/lib/auth/roles";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
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

export async function GET(request: Request) {
  const state = readState(request);
  const venture = state.activeVenture;
  return NextResponse.json({
    activeVenture: venture,
    role: state.roles[venture],
    ventures: listVentures(),
    roles: listRoles(venture).map((item) => ({
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

export async function POST(request: Request) {
  let body: { role?: string; venture?: string; activeVenture?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Send a JSON body with role and/or venture." }, { status: 400 });
  }

  const state = readState(request);
  const nextVenture: VentureKey = isVentureKey(body.venture ?? body.activeVenture)
    ? ((body.venture ?? body.activeVenture) as VentureKey)
    : state.activeVenture;

  if (body.role !== undefined && !isAppRole(body.role)) {
    return NextResponse.json({ error: "Choose owner, employee, customer, or vendor." }, { status: 400 });
  }

  const nextRole: AppRole = isAppRole(body.role) ? body.role : state.roles[nextVenture];
  const nextState: DemoSessionState = {
    activeVenture: nextVenture,
    roles: { ...state.roles, [nextVenture]: nextRole },
  };

  const definition = getRole(nextRole, nextVenture);
  const response = NextResponse.json({
    role: nextRole,
    venture: nextVenture,
    homeHref: homeForRole(nextRole, nextVenture),
    persona: definition.persona,
    ventureName: definition.ventureName,
  });

  const session = sessionCookieOptions(nextState);
  response.cookies.set(session.name, session.value, {
    httpOnly: session.httpOnly,
    sameSite: session.sameSite,
    path: session.path,
    maxAge: session.maxAge,
  });
  const legacy = roleCookieOptions(nextRole);
  response.cookies.set(legacy.name, legacy.value, {
    httpOnly: legacy.httpOnly,
    sameSite: legacy.sameSite,
    path: legacy.path,
    maxAge: legacy.maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ROLE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
