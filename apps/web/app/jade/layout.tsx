/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { JadeNav } from "@/components/jade-nav";
import { featuresSnapshot } from "@/lib/ventures/blueprint-store";
import { featuresForVenture } from "@/lib/ventures/live-features";

export default async function JadeLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await featuresSnapshot();
  const features = featuresForVenture(snapshot, "diaz_ventures");
  return (
    <div className="space-y-6">
      <JadeNav features={features} />
      {children}
    </div>
  );
}
