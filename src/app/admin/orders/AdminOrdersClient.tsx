"use client";

import React, { useState, useMemo } from "react";
import { formatINR } from "@/lib/utils";
import {
  Eye,
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Package,
  Search,
  RotateCcw,
} from "lucide-react";

export default function AdminOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Real-time metric calculations for the box cards
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(
      (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
    ).length;
    const completed = orders.filter((o) => o.status === "DELIVERED").length;
    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED" && o.paymentStatus !== "FAILED")
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    return { total, pending, completed, totalRevenue };
  }, [orders]);

  // Filtered orders list based on status and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Status filter
      if (statusFilter === "PENDING") {
        if (ord.status === "DELIVERED" || ord.status === "CANCELLED") return false;
      } else if (statusFilter === "DELIVERED") {
        if (ord.status !== "DELIVERED") return false;
      } else if (statusFilter !== "ALL") {
        if (ord.status !== statusFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = ord.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = ord.customerName?.toLowerCase().includes(q);
        const matchPhone = ord.customerPhone?.toLowerCase().includes(q);
        const matchEmail = ord.customerEmail?.toLowerCase().includes(q);
        const matchItem = Array.isArray(ord.items) && ord.items.some((itm: any) =>
          itm.name?.toLowerCase().includes(q)
        );
        if (!matchNumber && !matchCustomer && !matchPhone && !matchEmail && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

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
    <div className="space-y-6">
      {/* 1. Stat Cards (Box Type) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders Box */}
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`bg-white rounded-2xl border p-5 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "border-[#7B1123] ring-2 ring-[#7B1123]/15 shadow-sm"
              : "border-[#EFE8DE] hover:border-[#7B1123]/50"
          }`}
        >
          <div>
            <span className="text-xs text-[#7A6F68] font-medium block mb-1">
              Total Orders
            </span>
            <span className="text-2xl font-bold text-[#2B1A13]">
              {metrics.total}
            </span>
            <span className="text-[10px] text-[#7A6F68] block mt-0.5">
              All lifetime customer orders
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl border border-red-200 bg-red-50 text-[#7B1123] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </button>

        {/* Pending Orders Box */}
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`bg-white rounded-2xl border p-5 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === "PENDING"
              ? "border-amber-600 ring-2 ring-amber-600/15 shadow-sm"
              : "border-[#EFE8DE] hover:border-amber-500/50"
          }`}
        >
          <div>
            <span className="text-xs text-[#7A6F68] font-medium block mb-1">
              Pending Orders
            </span>
            <span className="text-2xl font-bold text-amber-700">
              {metrics.pending}
            </span>
            <span className="text-[10px] text-[#7A6F68] block mt-0.5">
              Requires processing & delivery
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </button>

        {/* Completed Orders Box */}
        <button
          type="button"
          onClick={() => setStatusFilter("DELIVERED")}
          className={`bg-white rounded-2xl border p-5 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === "DELIVERED"
              ? "border-emerald-600 ring-2 ring-emerald-600/15 shadow-sm"
              : "border-[#EFE8DE] hover:border-emerald-500/50"
          }`}
        >
          <div>
            <span className="text-xs text-[#7A6F68] font-medium block mb-1">
              Completed Orders
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              {metrics.completed}
            </span>
            <span className="text-[10px] text-[#7A6F68] block mt-0.5">
              Successfully delivered to buyer
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </button>

        {/* Total Revenue Box */}
        <div className="bg-white rounded-2xl border border-[#EFE8DE] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7A6F68] font-medium block mb-1">
              Total Order Revenue
            </span>
            <span className="text-2xl font-bold text-[#2B1A13]">
              {formatINR(metrics.totalRevenue)}
            </span>
            <span className="text-[10px] text-[#7A6F68] block mt-0.5">
              Cumulative gross orders
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EFE8DE] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, customer name, phone, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl text-xs text-[#2B1A13] placeholder-[#7A6F68] focus:outline-none focus:border-[#7B1123]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl text-xs font-semibold text-[#2B1A13] focus:outline-none focus:border-[#7B1123]"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="PENDING">Pending / Active ({metrics.pending})</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">Completed / Delivered ({metrics.completed})</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {(statusFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#7B1123] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#7A6F68]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Order</th>
                <th className="py-3.5 px-4 font-semibold">Product & Items</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Total</th>
                <th className="py-3.5 px-4 font-semibold">Payment</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DE]/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#7A6F68]">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const itms = Array.isArray(ord.items) ? ord.items : [];
                  const firstItem = itms[0];

                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-semibold text-[#2B1A13] whitespace-nowrap">
                        #{ord.orderNumber}
                      </td>

                      {/* Product Image & Items Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* Product Image Thumbnail */}
                          {firstItem?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstItem.image}
                              alt={firstItem.name || "Product"}
                              className="w-11 h-13 rounded-lg object-cover border border-[#E8DFD5] bg-[#FAF7F2] shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-11 h-13 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-center shrink-0 text-[#7A6F68]">
                              <Package className="w-4 h-4 opacity-50" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <span
                              className="font-semibold text-[#2B1A13] block truncate max-w-[180px]"
                              title={firstItem?.name}
                            >
                              {firstItem?.name || "Ordered Product"}
                            </span>
                            <span className="text-[11px] text-[#7A6F68] block mt-0.5">
                              {itms.length > 1
                                ? `+${itms.length - 1} more (${itms.length} items total)`
                                : `Qty: ${firstItem?.quantity || 1} ${
                                    firstItem?.size ? `• ${firstItem.size}` : ""
                                  }`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-[#2B1A13] block">{ord.customerName}</span>
                        <span className="text-[10px] text-[#7A6F68]">{ord.customerPhone}</span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#7A6F68] whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-bold text-[#7B1123] whitespace-nowrap">
                        {formatINR(ord.total)}
                      </td>

                      {/* Payment Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={ord.paymentStatus}
                          disabled={updatingId === ord.id}
                          onChange={(e) => handlePaymentStatusChange(ord.id, e.target.value)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-[#E8DFD5] bg-[#FAF7F2] cursor-pointer"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="FAILED">FAILED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </td>

                      {/* Order Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={ord.status}
                          disabled={updatingId === ord.id}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-[#E8DFD5] bg-[#FAF7F2] cursor-pointer"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
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

      {/* 4. Order Details Drawer / Modal */}
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
                className="p-1 hover:bg-white/10 rounded-full cursor-pointer"
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

              {/* Items List with Product Images */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#2B1A13]">
                  Purchased Items Snapshot ({Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0})
                </h4>
                <div className="divide-y divide-[#EFE8DE] border border-[#EFE8DE] rounded-xl overflow-hidden">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map(
                    (itm: any, idx: number) => (
                      <div key={idx} className="p-3 flex items-center gap-3 bg-white">
                        {itm.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={itm.image}
                            alt={itm.name}
                            className="w-12 h-16 rounded-md object-cover bg-gray-100 shrink-0 border border-[#E8DFD5]"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded-md bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center shrink-0 text-[#7A6F68]">
                            <Package className="w-4 h-4 opacity-50" />
                          </div>
                        )}
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
