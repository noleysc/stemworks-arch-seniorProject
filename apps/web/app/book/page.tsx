/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ServiceBookForm } from "@/components/experiences/service-book-form";
import { DEFAULT_EVENT_LOCATION, DEFAULT_HOST_NAME } from "@/lib/experiences/catalog";

export const dynamic = "force-dynamic";

/** Public client booking for individual spa services. No owner chrome. */
export default function BookServicePage({
  searchParams,
}: {
  searchParams?: { loop?: string };
}) {
  const loop = searchParams?.loop === "1" || searchParams?.loop === "true";

  return (
    <div
      className={
        loop
          ? "relative min-h-screen overflow-hidden bg-[#f3eee6] text-slate-950"
          : "relative min-h-screen overflow-hidden bg-[#f7f4ef] text-slate-950"
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(180,120,60,0.12),transparent_42%),radial-gradient(circle_at_88%_8%,rgba(80,110,140,0.1),transparent_36%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-14">
        <section className="space-y-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-800">
            {DEFAULT_HOST_NAME}
            {loop ? " · Display loop" : null}
          </p>
          <h1 className="max-w-xl font-display text-5xl leading-[0.95] text-slate-950 sm:text-6xl">
            Book a service
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-800">
            Reserve one massage, facial, or combo for yourself. This is separate from ticketed event invites.
          </p>
          <p className="text-sm font-medium text-slate-700">{DEFAULT_EVENT_LOCATION}</p>
          {loop ? (
            <p className="max-w-md text-sm leading-6 text-slate-700">
              Kiosk mode: services rotate automatically. After a booking confirms, this screen resets for the next
              guest.
            </p>
          ) : (
            <p className="text-sm text-slate-700">
              For a lobby display, open{" "}
              <a className="font-medium underline underline-offset-4" href="/book?loop=1">
                /book?loop=1
              </a>
              .
            </p>
          )}
        </section>
        <ServiceBookForm loop={loop} />
      </div>
    </div>
  );
}
