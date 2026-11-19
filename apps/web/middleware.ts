/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse, type NextRequest } from "next/server";

import { homeForRole, roleAllowsPath } from "@/lib/auth/roles";
import { parseSessionCookie } from "@/lib/auth/session";

/** Old paths → three named desks. */
const LEGACY_REWRITES: Array<{ from: RegExp; to: (match: RegExpMatchArray) => string }> = [
  { from: /^\/experiences(\/.*)?$/, to: (m) => `/thepamperedsoul${m[1] ?? ""}` },
  { from: /^\/rooms(\/.*)?$/, to: (m) => `/luminary/rooms${m[1] ?? ""}` },
  { from: /^\/restaurant(\/.*)?$/, to: (m) => `/luminary/restaurant${m[1] ?? ""}` },
  { from: /^\/import(\/.*)?$/, to: (m) => `/luminary/import${m[1] ?? ""}` },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) return NextResponse.next();

  for (const rule of LEGACY_REWRITES) {
    const match = pathname.match(rule.from);
    if (match) {
      const url = request.nextUrl.clone();
      url.pathname = rule.to(match);
      return NextResponse.redirect(url);
    }
  }

  const sessionRaw = request.cookies.get("stemworks_session")?.value;
  const legacyRole = request.cookies.get("stemworks_role")?.value;
  const state = parseSessionCookie(sessionRaw ?? legacyRole);
  const role = state.roles[state.activeVenture];

  if (!roleAllowsPath(role, pathname, state.activeVenture)) {
    if (pathname === "/") return NextResponse.next();
    const home = homeForRole(role, state.activeVenture);
    const url = request.nextUrl.clone();
    const [path, query] = home.split("?");
    url.pathname = path;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
