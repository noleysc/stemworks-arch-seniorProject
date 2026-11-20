/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ExperiencesNav } from "@/components/experiences-nav";
import { getDemoSession } from "@/lib/auth/session";
import { featuresSnapshot } from "@/lib/ventures/blueprint-store";
import { featuresForVenture } from "@/lib/ventures/live-features";

/** Pampered Soul owner/employee local nav under `/thepamperedsoul`. Guests use `/e/{slug}` or `/book`. */
export default async function ThePamperedSoulLayout({ children }: { children: React.ReactNode }) {
  const session = getDemoSession();
  const snapshot = await featuresSnapshot();
  const features = featuresForVenture(snapshot, "pampered_soul");
  return (
    <div className="space-y-6">
      <ExperiencesNav role={session.role} features={features} />
      {children}
    </div>
  );
}
