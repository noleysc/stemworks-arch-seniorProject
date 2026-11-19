/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { PlannerForm } from "@/components/experiences/planner-form";

export const dynamic = "force-dynamic";

export default function NewExperiencePage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">Ticketed invite creator · owner only</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Create a ticketed invite</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Write the invite, set ticket types and prices, optionally add spa treatments, then publish. Guests get a
          separate checkout page — this form never appears there.
        </p>
      </div>
      <PlannerForm />
    </div>
  );
}
