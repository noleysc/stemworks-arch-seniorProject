"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PamperedPageError({ reset, payment = false, booking = false }: { reset: () => void; payment?: boolean; booking?: boolean }) {
  const router = useRouter();
  return (
    <section role="alert" className="mx-auto my-10 max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-slate-950">
      <p className="text-sm text-slate-600">The Pampered Soul</p>
      <h1 className="font-display text-3xl">We couldn’t load this page</h1>
      <p className="text-sm leading-6 text-slate-600">
        Please try again. If the problem continues, contact The Pampered Soul for help.
        {payment ? " If you were completing a payment, check your payment status before trying to buy again." : ""}
        {booking ? " If you were booking a service, check your bookings with the spa before resubmitting." : ""}
      </p>
      <Button type="button" onClick={() => startTransition(() => { router.refresh(); reset(); })}>Try again</Button>
    </section>
  );
}
