/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { RecallBatchForm, ReleaseBatchButton } from "@/components/jade/batch-forms";
import { listBatches } from "@/lib/product/batches";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const batches = await listBatches();

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-sm text-emerald-900/60">
          <Link href="/jade/products" className="underline underline-offset-4">
            Products
          </Link>{" "}
          · batch ledger
        </p>
        <h1 className="mt-2 font-display text-4xl">Batches</h1>
        <p className="mt-2 text-sm leading-6 text-emerald-950/70">
          Every pour keeps its materials and finished units under one code. Release updates product inventory. Recall
          pulls remaining stock from that same code.
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-5 py-10">
          <p className="font-display text-2xl">No batches yet</p>
          <p className="mt-2 text-sm text-emerald-950/70">
            Order materials, then pour a batch of 6 or 10 from the products page.
          </p>
          <Link href="/jade/products" className="mt-4 inline-block text-sm underline underline-offset-4">
            Go to products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <article key={batch.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-emerald-900/50">{batch.code}</p>
                  <h2 className="text-xl font-medium">
                    {batch.skuName}{" "}
                    <span className="text-emerald-900/50">· {batch.skuCode}</span>
                  </h2>
                  <p className="mt-1 text-sm text-emerald-950/70">
                    {batch.statusLabel} · poured {batch.pouredOn} · {batch.unitsPoured} poured
                    {batch.status === "released" || batch.status === "recalled"
                      ? ` · ${batch.unitsPassedQc} passed QC`
                      : ""}
                    {batch.yieldPercent != null ? ` · yield ${batch.yieldPercent}%` : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{formatMoney(batch.materialCostCents)}</p>
                  <p className="text-emerald-900/60">material cost</p>
                  {batch.lineageUnitsRemaining > 0 ? (
                    <p className="mt-1 text-emerald-900/60">{batch.lineageUnitsRemaining} still on hand from this pour</p>
                  ) : null}
                </div>
              </div>

              <ul className="mt-4 space-y-1 text-sm text-emerald-950/80">
                {batch.materials.map((line) => (
                  <li key={`${batch.id}-${line.materialId}`}>
                    {line.materialName} · {line.quantityUsed} used · {formatMoney(line.totalCostCents)}
                    {line.purchaseLots.length > 0 ? (
                      <span className="text-emerald-900/50">
                        {" "}
                        · {line.purchaseLots.length} purchase lot{line.purchaseLots.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>

              {batch.notes ? <p className="mt-3 text-sm text-emerald-900/60">{batch.notes}</p> : null}
              {batch.recallReason ? (
                <p className="mt-3 text-sm text-amber-900">Recalled: {batch.recallReason}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-start gap-3">
                {batch.status === "in_production" || batch.status === "qc_review" || batch.status === "curing" ? (
                  <ReleaseBatchButton batchId={batch.id} unitsPoured={batch.unitsPoured} />
                ) : null}
              </div>

              {batch.status === "released" ? <RecallBatchForm batchId={batch.id} batchCode={batch.code} /> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
