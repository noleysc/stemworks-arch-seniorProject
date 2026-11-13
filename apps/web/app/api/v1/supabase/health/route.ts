/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Confirms the Stemworks desk can reach project kcskzamqbpzxlfpqisib. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        project: null,
        error: "Supabase env vars are not set. Copy apps/web/.env.example into .env.local.",
      },
      { status: 503 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = new URL(url).hostname.split(".")[0];

  try {
    const authRes = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    });
    const authBody = authRes.ok ? await authRes.json().catch(() => null) : null;

    return NextResponse.json({
      ok: authRes.ok,
      project: projectRef,
      url,
      auth: authRes.ok ? "reachable" : "error",
      detail: authRes.ok ? authBody : await authRes.text(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        project: projectRef,
        url,
        error: err instanceof Error ? err.message : "unknown error",
      },
      { status: 502 },
    );
  }
}
