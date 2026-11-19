/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { VentureDeskLink } from "@/components/shell/venture-desk-link";
import { getDemoSession } from "@/lib/auth/session";
import { listVentures } from "@/lib/auth/ventures";

export const dynamic = "force-dynamic";

export default function DeskHubPage() {
  const session = getDemoSession();
  const ventures = listVentures();

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Stemworks</p>
        <h1 className="mt-1 font-display text-4xl text-stone-950">Choose a desk</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Each venture keeps its own owner, employees, customers, and vendors. Opening a desk switches you into that
          venture’s identities — roles never cross tenants.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Active now: {session.definition.ventureName} · {session.definition.persona} ({session.definition.label})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ventures.map((venture) => (
          <VentureDeskLink
            key={venture.key}
            venture={venture.key}
            href={venture.deskHref}
            pathLabel={venture.deskHref}
            title={venture.shortName}
            body={
              venture.key === "luminary"
                ? "Hotel rentals and dining — Luminary’s own staff and outlet partners."
                : venture.key === "diaz_ventures"
                  ? "Jade Flowers product ops — pour team and supply partners."
                  : "Spa desk — therapists, guests, and invite-night vendors."
            }
          />
        ))}
      </div>

      <p className="text-sm text-stone-600">
        Owner boards (after switching into that venture):{" "}
        {ventures.map((venture, index) => (
          <span key={venture.key}>
            {index > 0 ? " · " : null}
            <Link href={venture.dashboardHref} className="underline underline-offset-4">
              {venture.shortName}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
