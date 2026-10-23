/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { SkuForm } from "@/components/jade/sku-form";
import { formatMoney } from "@/lib/money";
import { listSkus } from "@/lib/product/skus";

export const dynamic = "force-dynamic";

export default async function SkusPage() {
  const skus = await listSkus();

  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <h1 className="font-display text-4xl">SKUs</h1>
        <p className="mt-2 text-sm leading-6 text-emerald-950/70">
          Finished goods catalog with retail, wholesale, and event prices in cents. Available to sell is on-hand minus
          allocated.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <SkuForm />
        <div className="space-y-3">
          {skus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-5 py-10">
              <p className="font-display text-2xl">No SKUs yet</p>
              <p className="mt-2 text-sm text-emerald-950/70">Add a finished candle or product before taking orders.</p>
            </div>
          ) : (
            skus.map((sku) => (
              <article key={sku.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-emerald-900/50">{sku.code}</p>
                    <h2 className="text-lg font-medium">{sku.name}</h2>
                  </div>
                  <p className="text-sm text-emerald-900/60">{sku.availableToSell} available</p>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-emerald-900/50">Retail</dt>
                    <dd>{formatMoney(sku.retailCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-900/50">Wholesale</dt>
                    <dd>{formatMoney(sku.wholesaleCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-900/50">Event</dt>
                    <dd>{formatMoney(sku.eventCents)}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
