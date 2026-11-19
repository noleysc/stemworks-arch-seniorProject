/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { AppShell } from "@/components/shell/app-shell";
import { getDemoSession } from "@/lib/auth/session";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const session = getDemoSession();
  return (
    <AppShell role={session.role} venture={session.activeVenture} definition={session.definition}>
      {children}
    </AppShell>
  );
}
