"use client";

import { PamperedPageError } from "@/components/experiences/page-error";

export default function BookingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PamperedPageError reset={reset} booking />;
}
