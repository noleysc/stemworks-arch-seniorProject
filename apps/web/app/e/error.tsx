"use client";

import { PamperedPageError } from "@/components/experiences/page-error";

export default function GuestError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PamperedPageError reset={reset} payment />;
}
