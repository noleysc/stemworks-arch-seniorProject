/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { redirect } from "next/navigation";

import { AppOwnerHub } from "@/components/shell/app-owner-hub";
import { SessionPanel } from "@/components/shell/session-panel";
import { getDemoSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default function RootPage() {
  const session = getDemoSession();

  if (!session.signedIn) {
    redirect("/login");
  }

  if (session.appOwner) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f5f0e8,_#eef2f6_45%,_#e7ebe8)]">
        <div className="mx-auto flex max-w-5xl justify-end px-4 pt-6 sm:px-6">
          <div className="w-full max-w-xs">
            <SessionPanel
              role={session.role}
              venture={session.activeVenture}
              appOwner
              persona={session.definition.persona}
              ventureName={session.definition.ventureName}
            />
          </div>
        </div>
        <AppOwnerHub activeVenture={session.activeVenture} />
      </div>
    );
  }

  // Locked users are redirected by middleware; keep a safe fallback.
  redirect(session.definition.homeHref);
}
