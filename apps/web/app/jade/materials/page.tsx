/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { MaterialForm, PurchaseForm } from "@/components/jade/material-forms";
import { categoryLabel } from "@/lib/product/catalog";
import { listMaterials } from "@/lib/product/materials";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await listMaterials();

  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <h1 className="font-display text-4xl">Materials</h1>
        <p className="mt-2 text-sm leading-6 text-emerald-950/70">
          Catalog and purchase receipts. On-hand updates through an append-only movement. A material at or below reorder
          point publishes an inventory alert on the Diaz Ventures dashboard.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <MaterialForm />
        <div className="space-y-3">
          {materials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-5 py-10">
              <p className="font-display text-2xl">No materials yet</p>
              <p className="mt-2 text-sm text-emerald-950/70">Add wax, fragrance, vessels, or packaging to start the ledger.</p>
            </div>
          ) : (
            materials.map((material) => (
              <article key={material.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-medium">{material.name}</h2>
                    <p className="text-sm text-emerald-900/60">
                      {categoryLabel(material.category)} · {material.unit}
                      {material.supplier ? ` · ${material.supplier}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {material.quantityOnHand} {material.unit}
                    </p>
                    <p className={material.belowReorder ? "text-amber-800" : "text-emerald-900/60"}>
                      reorder at {material.reorderPoint}
                    </p>
                  </div>
                </div>
                <PurchaseForm materialId={material.id} />
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
