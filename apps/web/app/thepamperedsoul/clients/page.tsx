/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { SpaClientsBoard } from "@/components/experiences/spa-clients-board";
import { listSpaClients } from "@/lib/experiences/appointments";

export const dynamic = "force-dynamic";

export default async function SpaClientsPage() {
  const clients = await listSpaClients();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl leading-tight text-slate-950">Spa clients</h1>
          <p className="mt-2 text-sm text-slate-600">
            Preferences, staff notes, and appointment history for MassageBook-style client files.
          </p>
        </div>
        <Link
          href="/thepamperedsoul/bookings"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-[#eef2f6]"
        >
          Bookings
        </Link>
      </div>

      <SpaClientsBoard clients={clients} />
    </div>
  );
}
