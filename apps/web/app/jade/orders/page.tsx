/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { OrderPanel } from "@/components/jade/order-panel";
import { listOrders } from "@/lib/product/orders";
import { listSkus } from "@/lib/product/skus";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [skus, orders] = await Promise.all([listSkus(), listOrders()]);

  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <h1 className="font-display text-4xl">Orders</h1>
      </div>
      <OrderPanel skus={skus} orders={orders} />
    </div>
  );
}
