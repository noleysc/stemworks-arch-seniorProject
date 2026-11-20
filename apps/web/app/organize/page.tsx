/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { redirect } from "next/navigation";

import { VentureOrganizer } from "@/components/ventures/venture-organizer";
import { getDemoSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default function OrganizePage({
  searchParams,
}: {
  searchParams?: { disabled?: string };
}) {
  const session = getDemoSession();
  if (!session.signedIn) redirect("/login");
  if (!session.appOwner && session.role !== "owner") {
    redirect(session.definition.homeHref);
  }

  const featureDisabled = searchParams?.disabled === "1";

  return (
    <div className="space-y-4">
      {featureDisabled ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-900/20 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          That desk route is off for this venture. Re-enable the matching feature below, save, then open the desk
          again.
        </div>
      ) : null}
      <VentureOrganizer canCreate={session.appOwner || session.role === "owner"} />
    </div>
  );
}
