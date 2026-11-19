/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { ImportPanel } from "@/components/import-panel";
import { listRentalSources } from "@/lib/property";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const sources = await listRentalSources();

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl">Collect</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Each file lands on a rental source for Luminary Hotel & Co. The public website and Marriott reservation
          search do not publish this book, and Airbnb keeps reservations behind the host account. The same confirmation
          code updates the stay on that source. A matching code on a different source stays a separate rental.
        </p>
      </div>
      <ImportPanel sources={sources} />
    </div>
  );
}
