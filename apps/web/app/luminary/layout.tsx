/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { LuminaryNav } from "@/components/luminary-nav";

export default function LuminaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <LuminaryNav />
      {children}
    </div>
  );
}
