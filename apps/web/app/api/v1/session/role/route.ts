/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { ROLE_COOKIE, isAppRole, listRoles, type AppRole } from "@/lib/auth/roles";
import { roleCookieOptions } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    roles: listRoles().map((role) => ({
      key: role.key,
      label: role.label,
      summary: role.summary,
      homeHref: role.homeHref,
      kernelHint: role.kernelHint,
    })),
  });
}

export async function POST(request: Request) {
  let body: { role?: string } = {};
  try {
    body = (await request.json()) as { role?: string };
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a role." }, { status: 400 });
  }
  if (!isAppRole(body.role)) {
    return NextResponse.json({ error: "Choose owner, employee, customer, or vendor." }, { status: 400 });
  }
  const role = body.role as AppRole;
  const response = NextResponse.json({ role, homeHref: listRoles().find((item) => item.key === role)!.homeHref });
  const cookie = roleCookieOptions(role);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ role: "owner" });
  response.cookies.set(ROLE_COOKIE, "owner", { path: "/", maxAge: 0 });
  return response;
}
