/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ExperiencesNav } from "@/components/experiences-nav";

export default function ExperiencesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d9e2ec_0%,_#eef2f6_42%,_#f7f8fa_100%)] text-slate-950">
      <ExperiencesNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
