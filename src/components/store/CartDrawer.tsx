"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    cartCount,
  } = useStore();

  const [stockIssues, setStockIssues] = useState<Record<string, string>>({});
  const [hasOutOfStock, setHasOutOfStock] = useState(false);

  // Validate live stock whenever cart or drawer open changes
  useEffect(() => {
    if (!isCartOpen || cart.length === 0) {
      setStockIssues({});
      setHasOutOfStock(false);
      return;
    }

    let isMounted = true;
    async function checkStock() {
      try {
        const res = await fetch("/api/store/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const issues: Record<string, string> = {};
            let outOfStockFound = false;
            for (const status of data.itemStatuses || []) {
              if (!status.inStock) {
                issues[status.id] = status.error || "Out of stock";
                outOfStockFound = true;
              }
            }
            setStockIssues(issues);
            setHasOutOfStock(outOfStockFound);
          }
        }
      } catch (e) {
        console.error("Stock validation error:", e);
      }
    }

    checkStock();
    return () => {
      isMounted = false;
    };
  }, [isCartOpen, cart]);

  if (!isCartOpen) return null;

  const freeShippingThreshold = 999;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl relative animate-slide-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 px-6 border-b border-[#EFE8DE] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#7B1123]" />
            <h2 className="font-serif font-bold text-base text-[#2B1A13]">Your Shopping Bag</h2>
            <span className="text-xs bg-[#7B1123] text-white px-2 py-0.5 rounded-full font-medium">
              {cartCount}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-[#7A6F68] hover:text-[#2B1A13] hover:bg-[#EFE8DE]/60 rounded-full transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#7B1123] mb-4">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Your bag is empty</h3>
              <p className="text-xs text-[#7A6F68] max-w-xs mt-1 mb-6">
                Explore our festive edit, kurtis, dresses and accessories to find your favorites.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 rounded-xl border border-[#EFE8DE] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors"
              >
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#2B1A13] line-clamp-1">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#7A6F68] hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2 text-[11px] text-[#7A6F68] mt-1 items-center flex-wrap">
                      {item.size && <span>Size: <strong className="text-[#2B1A13]">{item.size}</strong></span>}
                      {item.color && <span>• Color: <strong className="text-[#2B1A13]">{item.color}</strong></span>}
                      {stockIssues[item.id] && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          {stockIssues[item.id]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8DFD5]/60">
                    <span className="text-xs font-bold text-[#7B1123]">{formatINR(item.price)}</span>

                    <div className="flex items-center border border-[#D8CFBF] rounded-md bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-[#FAF7F2] text-[#2B1A13] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-[#FAF7F2] text-[#2B1A13] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#EFE8DE] bg-[#FAF7F2] space-y-3">
            {hasOutOfStock && (
              <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Some items are out of stock. Please remove them before proceeding.</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#7A6F68]">
              <span>Subtotal</span>
              <span className="text-sm font-bold text-[#2B1A13]">{formatINR(cartTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#7A6F68]">
              <span>Estimated Shipping</span>
              <span className="text-xs font-medium text-emerald-700">
                {cartTotal >= freeShippingThreshold ? "FREE" : "₹99"}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E8DFD5] flex items-center justify-between font-bold text-sm text-[#2B1A13]">
              <span>Total</span>
              <span className="text-base text-[#7B1123]">
                {formatINR(cartTotal + (cartTotal >= freeShippingThreshold ? 0 : 99))}
              </span>
            </div>

            {hasOutOfStock ? (
              <button
                disabled
                className="w-full py-3 px-4 bg-gray-300 text-gray-500 text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-not-allowed mt-4"
              >
                Item(s) Out of Stock
              </button>
            ) : (
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 px-4 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all mt-4"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

