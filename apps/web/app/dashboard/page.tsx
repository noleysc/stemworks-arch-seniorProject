/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardBoard } from "@/components/dashboard/dashboard-board";
import { EmployeeHome } from "@/components/dashboard/employee-home";
import { getDemoSession } from "@/lib/auth/session";
import { getTenant, listTenants } from "@/lib/dashboard/registry";

export const dynamic = "force-dynamic";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  const session = getDemoSession();
  if (!session.signedIn) redirect("/");

  const { role, definition, activeVenture, appOwner } = session;
  if (role === "customer") redirect(definition.homeHref);
  if (role === "vendor") redirect(definition.homeHref);

  if (role === "employee" && !appOwner) {
    return <EmployeeHome />;
  }

  const tenants = listTenants();
  const tenantKey = appOwner
    ? tenants.some((tenant) => tenant.key === searchParams.tenant)
      ? (searchParams.tenant as string)
      : activeVenture
    : activeVenture;
  const tenant = getTenant(tenantKey);
  if (!tenant) redirect(definition.homeHref);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
            {appOwner ? "App owner" : "Owner"} · {definition.persona} · {tenant.name}
          </p>
          <h1 className="mt-1 font-display text-4xl">Command board</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {appOwner
              ? "Stemworks ownership can open every venture board. Switch tenants below without leaving app ownership."
              : `Money and attention for ${definition.ventureName} only. Sign out to enter a different venture.`}
          </p>
        </div>
        {appOwner ? (
          <div className="flex flex-wrap gap-2">
            {tenants.map((item) => (
              <Link
                key={item.key}
                href={`/dashboard?tenant=${item.key}`}
                className={
                  item.key === tenantKey
                    ? "rounded-full bg-stone-950 px-3 py-1.5 text-sm text-white"
                    : "rounded-full bg-white px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200"
                }
              >
                {item.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <Suspense fallback={<p className="text-sm text-stone-500">Loading the board.</p>}>
        <DashboardBoard
          tenantKey={tenantKey}
          ventureOptions={tenant.ventures.map((venture) => ({ key: venture.key, name: venture.name }))}
        />
      </Suspense>
    </div>
  );
}
