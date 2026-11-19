/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardBoard } from "@/components/dashboard/dashboard-board";
import { EmployeeHome } from "@/components/dashboard/employee-home";
import { getDemoSession } from "@/lib/auth/session";
import { getTenant } from "@/lib/dashboard/registry";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { role, definition, activeVenture } = getDemoSession();
  if (role === "customer") redirect(definition.homeHref);
  if (role === "vendor") redirect(definition.homeHref);

  if (role === "employee") {
    return <EmployeeHome />;
  }

  // Owner board is scoped to the active venture identity — switch venture in the sidebar to open another.
  const tenant = getTenant(activeVenture);
  if (!tenant) redirect(definition.homeHref);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          Owner · {definition.persona} · {definition.ventureName}
        </p>
        <h1 className="mt-1 font-display text-4xl">Command board</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Money and attention for {definition.ventureName} only. Employees, guests, and vendors of this venture are
          separate identities — switch venture in the sidebar to step into another desk’s owner.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-stone-500">Loading the board.</p>}>
        <DashboardBoard
          tenantKey={activeVenture}
          ventureOptions={tenant.ventures.map((venture) => ({ key: venture.key, name: venture.name }))}
        />
      </Suspense>
    </div>
  );
}
