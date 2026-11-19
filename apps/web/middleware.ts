/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_ROLE,
  ROLE_COOKIE,
  homeForRole,
  isAppRole,
  roleAllowsPath,
  type AppRole,
} from "@/lib/auth/roles";

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

  const raw = request.cookies.get(ROLE_COOKIE)?.value;
  const role: AppRole = isAppRole(raw) ? raw : DEFAULT_ROLE;

  if (!roleAllowsPath(role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
