/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ExperiencesNav } from "@/components/experiences-nav";
import { getDemoSession } from "@/lib/auth/session";

/** Pampered Soul owner/employee local nav under `/thepamperedsoul`. Guests use `/e/{slug}` or `/book`. */
export default function ThePamperedSoulLayout({ children }: { children: React.ReactNode }) {
  const session = getDemoSession();
  return (
    <div className="space-y-6">
      <ExperiencesNav role={session.role} />
      {children}
    </div>
  );
}
