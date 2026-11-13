/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import Link from "next/link";

import { CreateBatchForm } from "@/components/jade/batch-forms";
import { SkuForm } from "@/components/jade/sku-form";
import { listBatches } from "@/lib/product/batches";
import { listMaterials } from "@/lib/product/materials";
import { listSkus } from "@/lib/product/skus";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [skus, materials, batches] = await Promise.all([listSkus(), listMaterials(), listBatches()]);
  const stockedMaterials = materials.filter((row) => row.isActive && row.quantityOnHand > 0);
  const openBatches = batches.filter((row) => row.status === "in_production" || row.status === "qc_review");

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl">Products</h1>
        <p className="mt-2 text-sm leading-6 text-emerald-950/70">
          Finished goods and batch tracking. Order materials, pour a batch of 6 or 10, release into inventory, and keep
          every unit tied to one batch code for recall.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-4">
        <Step n="1" title="Order materials" body="Receive beeswax and other inputs on Materials." href="/jade/materials" />
        <Step n="2" title="Pour a batch" body="Use stock to make 6 or 10 finished units." href="#pour" />
        <Step n="3" title="Update inventory" body="Release the pour so SKU on-hand rises." href="/jade/batches" />
        <Step n="4" title="Recall together" body="One batch code pulls every linked unit." href="/jade/batches" />
      </ol>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <SkuForm />
          <div id="pour">
            <CreateBatchForm
              skus={skus.map((sku) => ({ id: sku.id, code: sku.code, name: sku.name }))}
              materials={stockedMaterials.map((material) => ({
                id: material.id,
                name: material.name,
                unit: material.unit,
                quantityOnHand: material.quantityOnHand,
              }))}
            />
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl">Catalog</h2>
              <Link href="/jade/batches" className="text-sm underline underline-offset-4">
                All batches
              </Link>
            </div>
            {skus.length === 0 ? (
              <Empty title="No products yet" body="Add a finished candle or product before pouring batches." />
            ) : (
              skus.map((sku) => (
                <article key={sku.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-emerald-900/50">{sku.code}</p>
                      <h3 className="text-lg font-medium">{sku.name}</h3>
                    </div>
                    <p className="text-sm text-emerald-900/60">{sku.availableToSell} available</p>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-emerald-900/50">Retail</dt>
                      <dd>{formatMoney(sku.retailCents)}</dd>
                    </div>
                    <div>
                      <dt className="text-emerald-900/50">On hand</dt>
                      <dd>{sku.unitsOnHand}</dd>
                    </div>
                    <div>
                      <dt className="text-emerald-900/50">Allocated</dt>
                      <dd>{sku.unitsAllocated}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl">Open pours</h2>
            {openBatches.length === 0 ? (
              <Empty title="No open batches" body="Pour a batch from stocked materials to start tracking." />
            ) : (
              openBatches.map((batch) => (
                <article key={batch.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-emerald-900/50">{batch.code}</p>
                      <h3 className="text-lg font-medium">
                        {batch.skuName} · {batch.unitsPoured} units
                      </h3>
                    </div>
                    <p className="text-emerald-900/60">{batch.statusLabel}</p>
                  </div>
                  <p className="mt-2 text-emerald-950/70">
                    Poured {batch.pouredOn} · materials {formatMoney(batch.materialCostCents)}
                  </p>
                  <Link href="/jade/batches" className="mt-3 inline-block underline underline-offset-4">
                    Release and track
                  </Link>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  href,
}: {
  n: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-emerald-900/10 bg-white p-4 transition hover:border-emerald-900/30">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-900/50">Step {n}</p>
      <p className="mt-2 font-medium text-emerald-950">{title}</p>
      <p className="mt-1 text-sm text-emerald-950/70">{body}</p>
    </Link>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-5 py-10">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-2 text-sm text-emerald-950/70">{body}</p>
    </div>
  );
}
