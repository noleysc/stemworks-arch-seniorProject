/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { LuminaryNav } from "@/components/luminary-nav";
import { featuresSnapshot } from "@/lib/ventures/blueprint-store";
import { featuresForVenture } from "@/lib/ventures/live-features";

export default async function LuminaryLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await featuresSnapshot();
  const features = featuresForVenture(snapshot, "luminary");
  return (
    <div className="space-y-6">
      <LuminaryNav features={features} />
      {children}
    </div>
  );
}
