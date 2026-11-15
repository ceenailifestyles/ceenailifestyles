import React from "react";
import Link from "next/link";
import { findCategories } from "@/lib/repositories/category";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { ShieldCheck, Lock, Eye, FileText, Bell, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
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

      {/* Main Content: Max-width 7xl given to match the navbar width */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full space-y-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#7A6F68]">
          <Link href="/" className="hover:text-[#7B1123] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#2B1A13] font-medium">Privacy Policy</span>
        </div>

        {/* Hero Header */}
        <div className="border-b border-[#EFE8DE] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] font-bold text-[#7B1123] uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C59A47]" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B1A13] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-2 max-w-3xl leading-relaxed">
            At Ceenai, we are committed to safeguarding your personal data and respecting your privacy. 
            This policy outlines how we collect, handle, protect, and process your information when you browse 
            and shop on our website.
          </p>
          <span className="text-[11px] text-[#7A6F68] block mt-2">
            Last Updated: November 2026
          </span>
        </div>

        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Legal Articles */}
          <div className="lg:col-span-2 space-y-8 text-xs sm:text-sm text-[#2B1A13] leading-relaxed">
            {/* 1. Information Collection */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <FileText className="w-5 h-5 text-[#C59A47]" />
                <h2>1. Information We Collect</h2>
              </div>
              <p className="text-[#7A6F68]">
                We only gather information necessary to provide an effortless shopping experience:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[#7A6F68] pl-2">
                <li><strong className="text-[#2B1A13]">Personal Identification:</strong> Your full name, email address, contact phone number, and delivery addresses.</li>
                <li><strong className="text-[#2B1A13]">Order Records:</strong> Purchase history, items chosen, sizes, billing records, and delivery status.</li>
                <li><strong className="text-[#2B1A13]">Technical & Browsing Data:</strong> IP address, device type, browser settings, and interaction logs through cookies to improve page performance.</li>
              </ul>
            </section>

            {/* 2. Usage of Information */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <Eye className="w-5 h-5 text-[#C59A47]" />
                <h2>2. How We Use Your Information</h2>
              </div>
              <p className="text-[#7A6F68]">
                Your information is used strictly to fulfill your orders and enhance store services:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[#7A6F68] pl-2">
                <li>Processing transactions, preparing your shipments, and dispatching packages via trusted courier partners.</li>
                <li>Sending transactional notifications including order confirmations, tracking codes, and delivery status updates.</li>
                <li>Assisting with customer support inquiries, exchange coordination, and refund processing.</li>
                <li>Preventing fraudulent orders and maintaining the security of our storefront.</li>
              </ul>
            </section>

            {/* 3. Payment Security */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <Lock className="w-5 h-5 text-[#C59A47]" />
                <h2>3. Payment Security & Processing</h2>
              </div>
              <p className="text-[#7A6F68]">
                Ceenai does <strong>not</strong> collect, view, or store your credit/debit card numbers, CVVs, or net banking passwords on our servers. All digital transactions are processed directly through <strong>Razorpay</strong>, an RBI-licensed, PCI-DSS Level 1 compliant payment gateway using end-to-end 256-bit SSL encryption.
              </p>
            </section>

            {/* 4. Cookies & Tracking */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <Bell className="w-5 h-5 text-[#C59A47]" />
                <h2>4. Cookies & Session Management</h2>
              </div>
              <p className="text-[#7A6F68]">
                We use strictly essential HTTP cookies to maintain your shopping cart, preserve your customer login session, and retain your saved wishlist items across visits. You can control cookie preferences in your browser settings, though disabling essential cookies may impact checkout functionality.
              </p>
            </section>

            {/* 5. Information Sharing */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <ShieldCheck className="w-5 h-5 text-[#C59A47]" />
                <h2>5. Third-Party Sharing</h2>
              </div>
              <p className="text-[#7A6F68]">
                We do not sell, rent, or trade your personal information to third parties. We share data solely with verified operational logistics partners (couriers like Delhivery, BlueDart, DTDC) and communications providers (transactional email and SMS systems) strictly required to deliver your orders.
              </p>
            </section>
          </div>

          {/* Right Sticky Sidebar: Quick Summary & Contact */}
          <div className="space-y-6">
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-6 space-y-4">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#2B1A13]">
                <ShieldCheck className="w-5 h-5 text-[#7B1123]" />
                <h3>Our Privacy Promise</h3>
              </div>
              <p className="text-xs text-[#7A6F68] leading-relaxed">
                Your trust is our highest priority. We never sell customer records and enforce enterprise-grade encryption for all user communications and transactions.
              </p>
              <div className="pt-3 border-t border-[#E8DFD5] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#7A6F68]">
                  <span>Data Encryption:</span>
                  <strong className="text-[#2B1A13]">256-bit SSL</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A6F68]">
                  <span>Payment Standard:</span>
                  <strong className="text-[#2B1A13]">PCI-DSS Level 1</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A6F68]">
                  <span>Marketing Selling:</span>
                  <strong className="text-[#7B1123]">Strict Zero Policy</strong>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#2B1A13]">
                <HelpCircle className="w-5 h-5 text-[#7B1123]" />
                <h3>Questions or Concerns?</h3>
              </div>
              <p className="text-xs text-[#7A6F68] leading-relaxed">
                If you have questions regarding your data or wish to request data updates, please contact our privacy compliance officer:
              </p>
              <div className="pt-2 text-xs space-y-1">
                <p className="text-[#2B1A13] font-semibold">Ceenai Support Desk</p>
                <p className="text-[#7A6F68]">Email: <a href={`mailto:${email}`} className="text-[#7B1123] hover:underline font-medium">{email}</a></p>
                <p className="text-[#7A6F68]">Helpline: <a href={`tel:${phone}`} className="text-[#7B1123] hover:underline font-medium">+91 {phone}</a></p>
                <p className="text-[#7A6F68] text-[11px] mt-2">Hours: Mon - Sat, 10:00 AM – 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer categories={categories} settings={settingsMap.footer_settings} />
    </div>
  );
}

