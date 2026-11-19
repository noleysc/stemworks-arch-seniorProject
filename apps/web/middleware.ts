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

export function middleware(request: NextRequest) {
  const raw = request.cookies.get(ROLE_COOKIE)?.value;
  const role: AppRole = isAppRole(raw) ? raw : DEFAULT_ROLE;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) return NextResponse.next();

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
