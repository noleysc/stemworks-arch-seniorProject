/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { PlannerForm } from "@/components/experiences/planner-form";

export const dynamic = "force-dynamic";

export default function NewExperiencePage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="mt-2 font-display text-4xl leading-tight text-slate-950">Create an event</h1>
      </div>
      <PlannerForm />
    </div>
  );
}
