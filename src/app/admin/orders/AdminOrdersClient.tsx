"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Eye, X, Check, MapPin, Calendar, CreditCard } from "lucide-react";

export default function AdminOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
    } catch {
      alert("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (id: string, paymentStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paymentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update payment status");

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, paymentStatus } : o))
      );
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev: any) => ({ ...prev, paymentStatus }));
      }
    } catch {
      alert("Failed to update payment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#7A6F68]">
              <tr>
                <th className="py-3 px-4 font-semibold">Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DE]/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#7A6F68]">
                    No orders in database.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const itms = Array.isArray(ord.items) ? ord.items : [];
                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="py-3 px-4 font-semibold text-[#2B1A13]">#{ord.orderNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#2B1A13] block">{ord.customerName}</span>
                        <span className="text-[10px] text-[#7A6F68]">{ord.customerPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-[#7A6F68]">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3 px-4 text-[#7A6F68]">{itms.length} items</td>
                      <td className="py-3 px-4 font-bold text-[#7B1123]">{formatINR(ord.total)}</td>
                      <td className="py-3 px-4">
                        <select
                          value={ord.paymentStatus}
                          disabled={updatingId === ord.id}
                          onChange={(e) => handlePaymentStatusChange(ord.id, e.target.value)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-md border border-[#E8DFD5] bg-[#FAF7F2]"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="FAILED">FAILED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          disabled={updatingId === ord.id}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-md border border-[#E8DFD5] bg-[#FAF7F2]"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-md transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-[#EFE8DE] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#7B1123] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base">Order #{selectedOrder.orderNumber}</h3>
                <span className="text-[11px] text-[#F7E7CE]">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]">
                <div>
                  <span className="text-[#7A6F68] font-medium block">Customer</span>
                  <strong className="text-sm text-[#2B1A13]">{selectedOrder.customerName}</strong>
                  <span className="text-[#7A6F68] block">{selectedOrder.customerEmail}</span>
                  <span className="text-[#7A6F68] block">{selectedOrder.customerPhone}</span>
                </div>
                <div>
                  <span className="text-[#7A6F68] font-medium block">Shipping Address</span>
                  <p className="text-[#2B1A13] mt-1 leading-relaxed">
                    {selectedOrder.shippingAddress?.addressLine},<br />
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                    {selectedOrder.shippingAddress?.postalCode}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#2B1A13]">
                  Purchased Items Snapshot
                </h4>
                <div className="divide-y divide-[#EFE8DE] border border-[#EFE8DE] rounded-xl overflow-hidden">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map(
                    (itm: any, idx: number) => (
                      <div key={idx} className="p-3 flex items-center gap-3 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={itm.image}
                          alt={itm.name}
                          className="w-12 h-16 rounded-md object-cover bg-gray-100 shrink-0"
                        />
                        <div className="flex-1">
                          <h5 className="font-semibold text-[#2B1A13]">{itm.name}</h5>
                          <span className="text-[11px] text-[#7A6F68]">
                            Qty: {itm.quantity} {itm.size && `• Size: ${itm.size}`}{" "}
                            {itm.color && `• Color: ${itm.color}`}
                          </span>
                          <span className="text-xs font-bold text-[#7B1123] block mt-0.5">
                            {formatINR(itm.price * itm.quantity)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Price summary */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] space-y-1.5">
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Subtotal</span>
                  <span>{formatINR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Shipping</span>
                  <span>{formatINR(selectedOrder.shippingFee)}</span>
                </div>
                <div className="pt-2 border-t border-[#E8DFD5] flex justify-between font-bold text-sm text-[#2B1A13]">
                  <span>Total Amount</span>
                  <span className="text-base text-[#7B1123]">{formatINR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

