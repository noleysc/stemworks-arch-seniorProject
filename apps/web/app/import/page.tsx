/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ImportPanel } from "@/components/import-panel";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl">Collect</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Luminary&apos;s public website and Marriott&apos;s reservation search do not publish the hotel&apos;s booking
          book. Marriott&apos;s robots.txt disallows reservation search. Airbnb keeps reservations behind the host
          account. This desk collects files the hotel exports from those systems, plus restaurant lists, and bookings
          someone types by hand.
        </p>
      </div>
      <ImportPanel />
    </div>
  );
}
