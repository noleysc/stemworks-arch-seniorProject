/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { CrmBoard } from "@/components/experiences/crm-board";
import { listCrmContacts } from "@/lib/experiences/crm";

export const dynamic = "force-dynamic";

export default async function ExperiencesCrmPage({
  searchParams,
}: {
  searchParams?: { business?: string };
}) {
  const business = searchParams?.business?.trim() || "";
  const contacts = await listCrmContacts(business || undefined);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-slate-950">Private business CRM</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Contacts appear here only after an explicit per-vendor opt-in at RSVP. Filter with{" "}
          <code className="rounded bg-slate-200/70 px-1">?business=jade_haven</code>,{" "}
          <code className="rounded bg-slate-200/70 px-1">jade_flowers</code>, or{" "}
          <code className="rounded bg-slate-200/70 px-1">charcuterie_co</code>.
        </p>
      </div>
      <CrmBoard contacts={contacts} businessFilter={business} />
    </div>
  );
}
