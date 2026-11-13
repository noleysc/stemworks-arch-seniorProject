/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ServiceBookForm } from "@/components/experiences/service-book-form";
import { DEFAULT_EVENT_LOCATION, DEFAULT_HOST_NAME } from "@/lib/experiences/catalog";

export const dynamic = "force-dynamic";

/** Public client booking for individual spa services. No owner chrome. */
export default function BookServicePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.22),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.14),transparent_30%),linear-gradient(160deg,#111827_0%,#020617_55%,#000_100%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="space-y-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber-100/80">
            {DEFAULT_HOST_NAME}
          </p>
          <h1 className="max-w-xl font-display text-5xl leading-[0.95] text-white sm:text-6xl">
            Book a service
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-300">
            Reserve one massage, facial, or combo for yourself. This is separate from ticketed event invites.
          </p>
          <p className="text-sm text-slate-400">{DEFAULT_EVENT_LOCATION}</p>
        </section>
        <ServiceBookForm />
      </div>
    </div>
  );
}
