/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ExperiencesNav } from "@/components/experiences-nav";

/** Pampered Soul owner/employee local nav under `/thepamperedsoul`. Guests use `/e/{slug}` or `/book`. */
export default function ThePamperedSoulLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ExperiencesNav />
      {children}
    </div>
  );
}
