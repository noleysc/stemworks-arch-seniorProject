/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const PROJECT = "stemworks-dev";

export async function GET() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!isSupabaseConfigured() || !url || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        project: PROJECT,
        url: url || null,
        auth: "unconfigured",
        detail:
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in apps/web/.env.local",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    const detail = await response.text();
    let auth: unknown = detail;
    try {
      auth = JSON.parse(detail);
    } catch {
      // keep raw text
    }

    return NextResponse.json(
      {
        ok: response.ok,
        project: PROJECT,
        url,
        auth,
        detail: response.ok
          ? "Supabase Auth health check succeeded"
          : `Auth health returned HTTP ${response.status}`,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown fetch error";
    return NextResponse.json(
      {
        ok: false,
        project: PROJECT,
        url,
        auth: null,
        detail: message,
      },
      { status: 502 },
    );
  }
}
