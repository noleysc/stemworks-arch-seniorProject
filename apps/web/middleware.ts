/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse, type NextRequest } from "next/server";

import { appOwnerAllowsPath, homeForRole, isPublicPath, roleAllowsPath } from "@/lib/auth/roles";
import { homeForSession, parseSessionCookie } from "@/lib/auth/session";
import { ventureFromPathname } from "@/lib/auth/ventures";
import {
  FEATURES_COOKIE,
  parseFeaturesCookie,
  pathAllowedByFeatures,
} from "@/lib/ventures/live-features";

/** Old paths → three named desks. */
const LEGACY_REWRITES: Array<{ from: RegExp; to: (match: RegExpMatchArray) => string }> = [
  { from: /^\/experiences(\/.*)?$/, to: (m) => `/thepamperedsoul${m[1] ?? ""}` },
  { from: /^\/rooms(\/.*)?$/, to: (m) => `/luminary/rooms${m[1] ?? ""}` },
  { from: /^\/restaurant(\/.*)?$/, to: (m) => `/luminary/restaurant${m[1] ?? ""}` },
  { from: /^\/import(\/.*)?$/, to: (m) => `/luminary/import${m[1] ?? ""}` },
];

function redirectTo(request: NextRequest, home: string) {
  const url = request.nextUrl.clone();
  const [path, query] = home.split("?");
  url.pathname = path;
  url.search = query ? `?${query}` : "";
  return NextResponse.redirect(url);
}

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

  if (pathname === "/login" && request.nextUrl.searchParams.get("logout") === "1") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.cookies.set("stemworks_session", "", { path: "/", maxAge: 0 });
    response.cookies.set("stemworks_role", "", { path: "/", maxAge: 0 });
    response.cookies.set(FEATURES_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  const sessionRaw = request.cookies.get("stemworks_session")?.value;
  const legacyRole = request.cookies.get("stemworks_role")?.value;
  const state = parseSessionCookie(sessionRaw ?? legacyRole);

  if (!state.signedIn) {
    if (isPublicPath(pathname)) return NextResponse.next();
    return redirectTo(request, "/login");
  }

  if (!state.appOwner && (pathname === "/" || pathname === "/login")) {
    return redirectTo(request, homeForRole(state.role, state.activeVenture));
  }

  const features = parseFeaturesCookie(request.cookies.get(FEATURES_COOKIE)?.value);
  const pathVenture = ventureFromPathname(pathname);

  // Feature gates — organizer toggles turn desk routes on/off for everyone.
  if (pathVenture) {
    const allowed = pathAllowedByFeatures(pathname, pathVenture, features);
    if (!allowed) {
      const fallback =
        state.appOwner || state.role === "owner"
          ? "/organize?disabled=1"
          : homeForRole(state.role, state.activeVenture);
      return redirectTo(request, fallback);
    }
  }

  if (state.appOwner) {
    if (appOwnerAllowsPath(pathname) || pathname.startsWith("/v/")) return NextResponse.next();
    return redirectTo(request, homeForSession(state));
  }

  if (!roleAllowsPath(state.role, pathname, state.activeVenture)) {
    return redirectTo(request, homeForRole(state.role, state.activeVenture));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
