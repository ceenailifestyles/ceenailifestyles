"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { Package, Calendar, ArrowRight, User } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function OrdersPage() {
  const { user, openAuthModal } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/store/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (e) {
        console.error("Orders load error", e);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        <div className="mb-6 pb-4 border-b border-[#EFE8DE]">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13]">
            My Orders
          </h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Track and view your past Ceenai couture purchases.
          </p>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl border border-[#EFE8DE] p-10 text-center my-6 shadow-xs">
            <User className="w-12 h-12 text-[#7B1123] mx-auto opacity-40 mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Please Sign In</h3>
            <p className="text-xs text-[#7A6F68] mt-1 mb-6">
              Sign in to your customer account to view your order history and status.
            </p>
            <button
              onClick={() => openAuthModal("login")}
              className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors"
            >
              Sign In to Account
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-xs text-[#7A6F68]">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EFE8DE] p-10 text-center my-6 shadow-xs">
            <Package className="w-12 h-12 text-[#7B1123] mx-auto opacity-40 mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">No orders placed yet</h3>
            <p className="text-xs text-[#7A6F68] mt-1 mb-6">
              You haven&apos;t placed any orders yet. Explore our collections to find your perfect fit!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#EFE8DE] overflow-hidden shadow-xs"
                >
                  {/* Order Head */}
                  <div className="bg-[#FAF7F2] p-4 px-6 border-b border-[#EFE8DE] flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-[#7A6F68]">Order Number:</span>{" "}
                      <strong className="text-[#2B1A13]">#{order.orderNumber}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#7A6F68]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                    </div>

                    <div>
                      <span className="text-[#7A6F68]">Total:</span>{" "}
                      <strong className="text-[#7B1123]">{formatINR(order.total)}</strong>
                    </div>

                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 divide-y divide-[#EFE8DE]/60 space-y-3">
                    {items.map((itm: any, idx: number) => (
                      <div key={idx} className="pt-3 first:pt-0 flex items-center gap-4 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={itm.image}
                          alt={itm.name}
                          className="w-14 h-18 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#2B1A13]">{itm.name}</h4>
                          <p className="text-[11px] text-[#7A6F68] mt-0.5">
                            Quantity: {itm.quantity} {itm.size && `• Size: ${itm.size}`} {itm.color && `• Color: ${itm.color}`}
                          </p>
                          <span className="text-xs font-bold text-[#7B1123] mt-1 block">
                            {formatINR(itm.price * itm.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

