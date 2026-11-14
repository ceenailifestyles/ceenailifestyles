import React from "react";
import { findOrders } from "@/lib/repositories/order";
import AdminOrdersClient from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await findOrders({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Orders & Fulfilment</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Process customer orders, update shipping progress, and review durable purchase snapshots.
        </p>
      </div>

      <AdminOrdersClient initialOrders={orders} />
    </div>
  );
}
