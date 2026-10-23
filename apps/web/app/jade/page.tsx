/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { listReorderAlerts } from "@/lib/product/materials";
import { listOrders, productTotals } from "@/lib/product/orders";
import { listSkus } from "@/lib/product/skus";
import { formatMoney } from "@/lib/money";
import { ensureJadeFlowers } from "@/lib/tenancy";
import { channelLabel, statusLabel } from "@/lib/product/catalog";

export const dynamic = "force-dynamic";

export default async function JadeHomePage() {
  const venture = await ensureJadeFlowers();
  const [totals, orders, skus, alerts] = await Promise.all([
    productTotals(),
    listOrders(),
    listSkus(),
    listReorderAlerts(),
  ]);
  const open = orders.filter((order) => order.status === "pending" || order.status === "processing");

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-sm text-emerald-900/60">{venture.statusLabel} · prefix {venture.prefixCode}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-emerald-950">{venture.name}</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-950/70">
          Product operations for the Diaz Ventures tenant. Materials, SKUs, and orders feed the Stemworks dashboard
          through the product port. This book does not mix with Luminary.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Confirmed" value={formatMoney(totals.confirmedCents)} detail="processing, shipped, delivered" />
        <Stat label="Potential" value={formatMoney(totals.potentialCents)} detail="confirmed plus pending" />
        <Stat label="Open orders" value={String(open.length)} detail={`${skus.length} active SKUs`} href="/jade/orders" />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-5">
          <h2 className="font-display text-2xl">Reorder alerts</h2>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-950/70">No materials are at or below reorder point.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {alerts.map((material) => (
                <li key={material.id} className="text-sm">
                  <span className="font-medium">{material.name}</span>
                  <span className="text-emerald-900/60">
                    {" "}
                    · {material.quantityOnHand} {material.unit} on hand · reorder {material.reorderPoint}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/jade/materials" className="mt-4 inline-block text-sm underline underline-offset-4">
            Materials
          </Link>
        </div>
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-5">
          <h2 className="font-display text-2xl">Open orders</h2>
          {open.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-950/70">No pending or processing orders.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {open.slice(0, 5).map((order) => (
                <li key={order.id} className="flex justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{order.code}</span>
                    <span className="text-emerald-900/60">
                      {" "}
                      · {order.customerName} · {channelLabel(order.channel)} · {statusLabel(order.status)}
                    </span>
                  </span>
                  <span>{formatMoney(order.netAmountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-sm text-emerald-900/60">
        See the Diaz Ventures board on{" "}
        <Link className="underline underline-offset-4" href="/dashboard?tenant=diaz_ventures">
          Dashboard
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-[0.16em] text-emerald-900/50">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
      <p className="text-sm text-emerald-900/60">{detail}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-2xl border border-emerald-900/10 bg-white p-5 hover:border-emerald-900/30">
        {body}
      </Link>
    );
  }
  return <div className="rounded-2xl border border-emerald-900/10 bg-white p-5">{body}</div>;
}
