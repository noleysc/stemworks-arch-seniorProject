/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";
import { Suspense } from "react";

import { DashboardBoard } from "@/components/dashboard/dashboard-board";
import { getTenant, listTenants } from "@/lib/dashboard/registry";

export const dynamic = "force-dynamic";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  const tenants = listTenants();
  const tenantKey = tenants.some((tenant) => tenant.key === searchParams.tenant)
    ? (searchParams.tenant as string)
    : "luminary";
  const tenant = getTenant(tenantKey)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Stemworks</p>
          <h1 className="mt-1 font-display text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            One board per tenant. Ventures plug in through module ports. Luminary and Diaz Ventures never sum into each
            other.
          </p>
        </div>
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
