/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { usePathname } from "next/navigation";

import { DeskNav } from "@/components/desk-nav";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/jade")) {
    return <>{children}</>;
  }

  return (
    <>
      <DeskNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
