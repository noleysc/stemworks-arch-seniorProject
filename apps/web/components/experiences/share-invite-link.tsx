/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareInviteLink({
  slug,
  published,
}: {
  slug: string;
  published: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const path = `/e/${slug}`;
  const absolute =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!published) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-900/15 bg-white/70 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Guest invite</p>
        <h2 className="mt-2 font-display text-2xl">Not public yet</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Publish this ticketed invite to unlock the guest link. Guests buy tickets there — they never see the
          creator desk.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-[#eef2f6]">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Share this ticketed invite</p>
      <p className="mt-3 break-all font-mono text-sm text-slate-200">{absolute}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-sm text-[#eef2f6] hover:bg-white/10"
        >
          Open guest page
        </a>
      </div>
    </div>
  );
}
