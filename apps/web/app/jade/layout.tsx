/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { JadeNav } from "@/components/jade-nav";

export default function JadeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <JadeNav />
      {children}
    </div>
  );
}
