/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { NextResponse } from "next/server";

import { featuresSnapshot } from "@/lib/ventures/blueprint-store";
import { featuresCookieOptions } from "@/lib/ventures/live-features";

export async function attachFeaturesCookie(response: NextResponse): Promise<NextResponse> {
  const snapshot = await featuresSnapshot();
  const cookie = featuresCookieOptions(snapshot);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  return response;
}

export function clearFeaturesCookie(response: NextResponse): void {
  response.cookies.set("stemworks_features", "", { path: "/", maxAge: 0 });
}
