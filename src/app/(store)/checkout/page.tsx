"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useStore } from "@/context/StoreContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { user, cart, cartTotal, clearCart } = useStore();

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const [stockIssues, setStockIssues] = useState<Record<string, string>>({});
  const [hasOutOfStock, setHasOutOfStock] = useState(false);

  // Validate live inventory on checkout mount and cart change
  React.useEffect(() => {
    if (cart.length === 0) {
      setStockIssues({});
      setHasOutOfStock(false);
      return;
    }

    let isMounted = true;
    async function validateStock() {
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
            let outFound = false;
            for (const s of data.itemStatuses || []) {
              if (!s.inStock) {
                issues[s.id] = s.error || "Out of stock";
                outFound = true;
              }
            }
            setStockIssues(issues);
            setHasOutOfStock(outFound);
          }
        }
      } catch (e) {
        console.error("Checkout stock check error:", e);
      }
    }

    validateStock();
    return () => {
      isMounted = false;
    };
  }, [cart]);

  // Sync user profile if loaded
  React.useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  const shippingFee = cartTotal >= 999 ? 0 : 99;
  const grandTotal = cartTotal + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (hasOutOfStock) {
      setError(
        "One or more items in your cart are currently out of stock. Please remove them before placing your order."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === "ONLINE") {
        // Ensure Razorpay SDK script is loaded
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error(
            "Razorpay payment gateway failed to load. Please check your internet connection."
          );
        }

        // Create Razorpay order on server
        const createRes = await fetch("/api/store/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: {
              customerName,
              customerEmail,
              customerPhone,
              addressLine,
              city,
              state,
              postalCode,
              paymentMethod: "ONLINE",
              notes,
            },
            items: cart,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || "Failed to initialize payment.");
        }

        const options = {
          key: createData.keyId,
          amount: createData.amount,
          currency: createData.currency,
          name: "CeeneAI Couture",
          description: "Luxury Women's Apparel",
          image: "/logo.png",
          order_id: createData.orderId,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: "#7B1123",
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setIsSubmitting(true);
              const orderRes = await fetch("/api/store/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer: {
                    customerName,
                    customerEmail,
                    customerPhone,
                    addressLine,
                    city,
                    state,
                    postalCode,
                    paymentMethod: "ONLINE",
                    notes,
                  },
                  items: cart,
                  razorpayPayment: response,
                }),
              });

              const orderData = await orderRes.json();
              if (!orderRes.ok) {
                throw new Error(orderData.error || "Failed to finalize order.");
              }

              setPlacedOrder(orderData.order);
              clearCart();
            } catch (finalizeErr: any) {
              setError(
                finalizeErr.message ||
                  "Payment verified but order creation failed."
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (failure: any) => {
          setIsSubmitting(false);
          setError(
            failure?.error?.description ||
              "Payment failed. Please try another method or card."
          );
        });
        rzp.open();
        return;
      }

      // Cash on Delivery flow
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            customerName,
            customerEmail,
            customerPhone,
            addressLine,
            city,
            state,
            postalCode,
            paymentMethod: "COD",
            notes,
          },
          items: cart,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      setPlacedOrder(data.order);
      clearCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (paymentMethod !== "ONLINE") {
        setIsSubmitting(false);
      }
    }
  };

  if (placedOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <AnnouncementBar />
        <Header />

        <main className="max-w-2xl mx-auto px-4 py-16 flex-1 w-full text-center">
          <div className="bg-white rounded-3xl border border-[#EFE8DE] p-8 sm:p-12 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C59A47]">
                Order Confirmed
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#2B1A13] mt-1">
                Thank You, {placedOrder.customerName}!
              </h1>
              <p className="text-xs text-[#7A6F68] mt-2">
                Your order <strong className="text-[#2B1A13]">#{placedOrder.orderNumber}</strong> has been received and is being prepared with elegance.
              </p>
            </div>

            <div className="bg-[#FAF7F2] rounded-xl p-4 text-xs text-left space-y-2 border border-[#E8DFD5]">
              <div className="flex justify-between">
                <span className="text-[#7A6F68]">Total Amount Paid/Payable:</span>
                <span className="font-bold text-[#7B1123]">{formatINR(placedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6F68]">Payment Method:</span>
                <span className="font-semibold">{placedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6F68]">Delivery Destination:</span>
                <span className="font-semibold">
                  {placedOrder.shippingAddress?.city}, {placedOrder.shippingAddress?.postalCode}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/orders"
                className="px-6 py-3 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs"
              >
                View My Orders
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-white text-[#2B1A13] border border-[#E8DFD5] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <AnnouncementBar />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:py-12 flex-1 w-full">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13] tracking-tight mb-2">
          Secure Checkout
        </h1>
        <p className="text-xs text-[#7A6F68] mb-8">
          Complete your delivery and payment details to receive your Ceenai couture.
        </p>

        {error && (
          <div className="mb-6 flex items-start gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg max-w-3xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {hasOutOfStock && (
          <div className="mb-6 flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg max-w-3xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Some items in your cart are currently out of stock. Please return to your shopping bag to remove them before proceeding.
            </span>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EFE8DE] p-12 text-center max-w-md mx-auto my-6">
            <ShoppingBag className="w-12 h-12 text-[#7B1123] mx-auto opacity-40 mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Your cart is empty</h3>
            <p className="text-xs text-[#7A6F68] mt-1 mb-6">
              Please add items to your cart before proceeding to checkout.
            </p>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Shipping & Contact Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#2B1A13] pb-3 border-b border-[#EFE8DE]">
                1. Delivery & Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Enter street address"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Enter your state"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">Postal Code (PIN)</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Enter postal code"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B1A13] mb-1">Order Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter order notes"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-[#EFE8DE] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B1A13]">
                  2. Select Payment Method
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "COD"
                        ? "border-[#7B1123] bg-[#7B1123]/5"
                        : "border-[#E8DFD5] bg-[#FAF7F2]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="accent-[#7B1123] mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#2B1A13] block">Cash on Delivery (COD)</span>
                      <span className="text-[11px] text-[#7A6F68]">Pay with cash or UPI upon delivery</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "ONLINE"
                        ? "border-[#7B1123] bg-[#7B1123]/5"
                        : "border-[#E8DFD5] bg-[#FAF7F2]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => setPaymentMethod("ONLINE")}
                      className="accent-[#7B1123] mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#2B1A13] block">Online Payment</span>
                      <span className="text-[11px] text-[#7A6F68]">Instant payment via UPI / NetBanking / Cards</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT: Order Summary & Placement (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-5 sticky top-24">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#2B1A13] pb-3 border-b border-[#EFE8DE]">
                Order Summary ({cart.length} {cart.length === 1 ? "item" : "items"})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-18 rounded-md object-cover bg-gray-100 shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#2B1A13] line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-[#7A6F68]">
                        Qty: {item.quantity} {item.size && `• Size: ${item.size}`}
                      </p>
                      {stockIssues[item.id] && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {stockIssues[item.id]}
                        </span>
                      )}
                      <span className="font-bold text-[#7B1123] mt-1 block">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-[#EFE8DE] text-xs">
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#2B1A13]">{formatINR(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-emerald-700">
                    {shippingFee === 0 ? "FREE" : formatINR(shippingFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E8DFD5] flex justify-between text-sm font-bold text-[#2B1A13]">
                  <span>Grand Total</span>
                  <span className="text-lg text-[#7B1123]">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* Submit Button (Shown in Order Summary card on both desktop & mobile) */}
              <button
                type="submit"
                disabled={isSubmitting || hasOutOfStock}
                className="w-full py-3.5 px-4 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {hasOutOfStock
                  ? "Items Out of Stock"
                  : isSubmitting
                  ? "Placing Order..."
                  : `Buy Now (${formatINR(grandTotal)})`}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6F68] pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Encrypted & Secure Checkout</span>
              </div>
            </div>

            {/* Mobile Sticky Bottom Bar with Buy Now Button */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EFE8DE] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6F68] block">
                  Total Payable
                </span>
                <span className="text-base font-bold text-[#7B1123]">
                  {formatINR(grandTotal)}
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || hasOutOfStock}
                className="flex-1 max-w-[220px] py-3 px-5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{hasOutOfStock ? "Out of Stock" : isSubmitting ? "Placing..." : "Buy Now"}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

