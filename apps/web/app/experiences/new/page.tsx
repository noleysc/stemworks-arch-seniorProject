/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { PlannerForm } from "@/components/experiences/planner-form";

export const dynamic = "force-dynamic";

export default function NewExperiencePage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-slate-600">Owner desk · not the guest invite</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Plan an event</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Fill the invite, then add massages, facials, and other Pampered Soul treatments from the spa
          menu. Guests only see what you put on this event — at a separate public link.
        </p>
      </div>
      <PlannerForm />
    </div>
  );
}
