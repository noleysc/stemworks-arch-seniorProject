/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("_stemworks_health").select("*").limit(1);
    // Missing table is fine — it still proves Auth/REST accepted the key.
    const reachable =
      !error ||
      error.code === "PGRST116" ||
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("does not exist") ||
      error.message?.toLowerCase().includes("could not find");

    return NextResponse.json({
      ok: reachable,
      project: projectRef,
      url,
      rest: reachable ? "reachable" : "error",
      detail: error && !reachable ? error.message : null,
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
