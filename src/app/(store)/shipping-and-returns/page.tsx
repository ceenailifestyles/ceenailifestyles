import React from "react";
import Link from "next/link";
import { findCategories } from "@/lib/repositories/category";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import {
  Truck,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PackageCheck,
  CreditCard,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShippingAndReturnsPage() {
  const [categories, siteSettings] = await Promise.all([
    findCategories({
      where: { parentId: null, isActive: true },
      orderBy: { displayOrder: "asc" },
      includeChildren: true,
    }),
    findSiteSettings({
      key: { in: ["footer_settings", "announcement_bar"] },
    }),
  ]);

  const settingsMap: Record<string, any> = {};
  for (const s of siteSettings) {
    settingsMap[s.key] = s.value;
  }

  const phone = settingsMap.footer_settings?.phone || "9987087055";
  const email = settingsMap.footer_settings?.email || "support@ceenai.in";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar settings={settingsMap.announcement_bar} />
      <Header categories={categories} />

      {/* Main Content: Max-width 7xl given to match navbar width */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#7A6F68]">
          <Link href="/" className="hover:text-[#7B1123] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#2B1A13] font-medium">Shipping & Return Policy</span>
        </div>

        {/* Hero Header */}
        <div className="border-b border-[#EFE8DE] pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] font-bold text-[#7B1123] uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5 text-[#C59A47]" />
              <span>Pan-India Delivery</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] font-bold text-[#7B1123] uppercase tracking-wider">
              <RotateCcw className="w-3.5 h-3.5 text-[#C59A47]" />
              <span>7-Day Easy Returns</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B1A13] tracking-tight">
            Shipping & Return Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-2 max-w-3xl leading-relaxed">
            Everything you need to know about our fast domestic delivery, packaging care, 
            doorstep return pickups, and hassle-free refund process.
          </p>
        </div>

        {/* 4 Quick Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center shrink-0 text-[#7B1123]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-[#7A6F68] font-medium block">Free Delivery</span>
              <strong className="text-sm text-[#2B1A13]">Orders above ₹999</strong>
            </div>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center shrink-0 text-[#7B1123]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-[#7A6F68] font-medium block">Dispatch Timeline</span>
              <strong className="text-sm text-[#2B1A13]">Within 24-48 Hours</strong>
            </div>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center shrink-0 text-[#7B1123]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-[#7A6F68] font-medium block">Returns Window</span>
              <strong className="text-sm text-[#2B1A13]">7 Days from Delivery</strong>
            </div>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center shrink-0 text-[#7B1123]">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-[#7A6F68] font-medium block">Refund Settlement</span>
              <strong className="text-sm text-[#2B1A13]">5-7 Business Days</strong>
            </div>
          </div>
        </div>

        {/* SECTION 1: SHIPPING & DELIVERY */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#EFE8DE]">
            <div className="w-9 h-9 rounded-xl bg-[#7B1123] text-white flex items-center justify-center font-serif font-bold text-base">
              1
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B1A13]">
                Domestic Shipping Policy
              </h2>
              <p className="text-xs text-[#7A6F68]">
                Fast, secure transit handled by India&apos;s leading courier services.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-[#2B1A13] leading-relaxed">
            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7B1123]" />
                Delivery Timelines & Rates
              </h3>
              <p className="text-[#7A6F68]">
                We partner with premier courier networks (Delhivery, BlueDart, DTDC) to deliver your couture across 19,000+ pin codes in India:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#7A6F68] pl-1">
                <li><strong className="text-[#2B1A13]">Metro Cities (Mumbai, Delhi, Bengaluru, etc.):</strong> 2 to 4 business days.</li>
                <li><strong className="text-[#2B1A13]">Tier 2 & Tier 3 Cities / Rest of India:</strong> 4 to 7 business days.</li>
                <li><strong className="text-[#2B1A13]">Free Shipping:</strong> Automatically applied on all orders totaling ₹999 or more.</li>
                <li><strong className="text-[#2B1A13]">Standard Shipping Fee:</strong> A nominal flat fee of ₹99 applies on orders under ₹999.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#7B1123]" />
                Order Tracking & Packaging
              </h3>
              <p className="text-[#7A6F68]">
                We ensure complete visibility from dispatch to delivery:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#7A6F68] pl-1">
                <li><strong className="text-[#2B1A13]">Instant Tracking Link:</strong> As soon as your order is packed and dispatched from Mumbai, you receive an SMS and email with your unique AWB tracking link.</li>
                <li><strong className="text-[#2B1A13]">Tamper-Proof Packaging:</strong> Every garment is enclosed in custom poly-wrapped tamper-evident bags with protective luxury tissue wrapping.</li>
                <li><strong className="text-[#2B1A13]">Delivery Verification:</strong> Handover is completed securely via OTP or signature upon arrival.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: RETURN, EXCHANGE & REFUND POLICY */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#EFE8DE]">
            <div className="w-9 h-9 rounded-xl bg-[#7B1123] text-white flex items-center justify-center font-serif font-bold text-base">
              2
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B1A13]">
                Return, Exchange & Refund Policy
              </h2>
              <p className="text-xs text-[#7A6F68]">
                Shop with complete peace of mind with our 7-day doorstep exchange and return service.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs sm:text-sm text-[#2B1A13] leading-relaxed">
            {/* Return Eligibility */}
            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Return Eligibility
              </h3>
              <p className="text-[#7A6F68]">
                We accept returns and size exchanges requested within <strong>7 days</strong> of delivery, provided:
              </p>
              <ul className="space-y-2 text-[#7A6F68]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>The item is in original, unworn, and unwashed condition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>All original brand price tags and labels are intact.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Garment is returned in its original brand box/packaging.</span>
                </li>
              </ul>
            </div>

            {/* Easy Return Process */}
            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#7B1123]" />
                How to Initiate a Return
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-[#7A6F68]">
                <li>Sign in to your account and navigate to <Link href="/orders" className="text-[#7B1123] font-semibold underline">My Orders</Link>.</li>
                <li>Select the delivered order and click <em>&quot;Request Return / Exchange&quot;</em>.</li>
                <li>Select your reason (e.g. size fitting, alternate color).</li>
                <li>Our courier partner will pick up the package from your doorstep within 24 to 48 hours.</li>
              </ol>
            </div>

            {/* Refund Settlement */}
            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#7B1123]" />
                Refund Timelines
              </h3>
              <p className="text-[#7A6F68]">
                Once the returned item arrives at our Mumbai warehouse and clears quality inspection:
              </p>
              <ul className="space-y-2 text-[#7A6F68]">
                <li><strong className="text-[#2B1A13]">Prepaid Orders (Cards/UPI):</strong> Refund credited back to your original source account within 5 to 7 business days.</li>
                <li><strong className="text-[#2B1A13]">Cash on Delivery:</strong> Refund credited via direct bank transfer (NEFT/IMPS) or UPI within 3 to 5 business days after bank details confirmation.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 3: CANCELLATIONS & NON-RETURNABLE ITEMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-6 space-y-3">
            <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Order Cancellation Policy
            </h3>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              You may cancel an order anytime before it has been marked as <strong>SHIPPED</strong> directly from your <Link href="/orders" className="text-[#7B1123] font-semibold underline">Orders page</Link> or by contacting customer support. Once an order is handed over to our courier, it cannot be intercepted in transit but can be returned upon delivery following the standard 7-day return procedure.
            </p>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-6 space-y-3">
            <h3 className="font-bold text-base text-[#2B1A13] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7B1123]" />
              Non-Returnable Items
            </h3>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              For hygiene reasons, intimate wear items (undergarments) and items altered or tailored to custom measurements upon customer request are non-returnable unless received in a damaged or defective state.
            </p>
          </div>
        </div>

        {/* Support Help Card */}
        <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Need Assistance with Shipping or Returns?</h3>
            <p className="text-xs text-[#7A6F68] mt-1 max-w-xl">
              Our concierge team is available to assist you with order status, reverse pickups, and size consultations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={`mailto:${email}`}
              className="px-5 py-2.5 bg-white border border-[#E8DFD5] hover:border-[#7B1123] text-xs font-semibold text-[#2B1A13] rounded-xl transition-colors shadow-2xs"
            >
              Email: {email}
            </a>
            <a
              href={`tel:${phone}`}
              className="px-5 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Call: +91 {phone}
            </a>
          </div>
        </div>
      </main>

      <Footer categories={categories} settings={settingsMap.footer_settings} />
    </div>
  );
}

