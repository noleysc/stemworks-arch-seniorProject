/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { AppShell } from "@/components/shell/app-shell";
import { getDemoSession } from "@/lib/auth/session";
import { featuresSnapshot } from "@/lib/ventures/blueprint-store";
import { featuresForVenture, filterNavByFeatures } from "@/lib/ventures/live-features";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const session = getDemoSession();
  if (!session.signedIn) {
    return <>{children}</>;
  }

  const snapshot = await featuresSnapshot();
  const features = featuresForVenture(snapshot, session.activeVenture);
  const definition = {
    ...session.definition,
    nav: filterNavByFeatures(session.definition.nav, features, snapshot),
  };

  return (
    <AppShell
      role={session.role}
      venture={session.activeVenture}
      definition={definition}
      appOwner={session.appOwner}
    >
      {children}
    </AppShell>
  );
}
