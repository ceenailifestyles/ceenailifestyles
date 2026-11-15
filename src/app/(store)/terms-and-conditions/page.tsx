import React from "react";
import Link from "next/link";
import { findCategories } from "@/lib/repositories/category";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { Scale, CheckCircle2, AlertCircle, HelpCircle, FileCheck, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TermsAndConditionsPage() {
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
          <span className="text-[#2B1A13] font-medium">Terms & Conditions</span>
        </div>

        {/* Hero Header */}
        <div className="border-b border-[#EFE8DE] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] font-bold text-[#7B1123] uppercase tracking-wider mb-3">
            <Scale className="w-3.5 h-3.5 text-[#C59A47]" />
            <span>Storefront User Agreement</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B1A13] tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-2 max-w-3xl leading-relaxed">
            Welcome to Ceenai. These terms govern your access to our online boutique, catalog browsing, 
            account registration, and purchase orders. By using this platform, you agree to these terms in full.
          </p>
          <span className="text-[11px] text-[#7A6F68] block mt-2">
            Effective Date: November 2026
          </span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Terms Sections */}
          <div className="lg:col-span-2 space-y-8 text-xs sm:text-sm text-[#2B1A13] leading-relaxed">
            {/* 1. General Agreement */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <FileCheck className="w-5 h-5 text-[#C59A47]" />
                <h2>1. Acceptance of Terms</h2>
              </div>
              <p className="text-[#7A6F68]">
                By visiting our website or ordering our garments and lifestyle accessories, you engage in our service and agree to be bound by the following terms, conditions, and store notices. If you do not agree to all terms of this agreement, you may not access the website or use our services.
              </p>
            </section>

            {/* 2. Product Information & Color Variations */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <CheckCircle2 className="w-5 h-5 text-[#C59A47]" />
                <h2>2. Product Accuracy & Color Nuance</h2>
              </div>
              <p className="text-[#7A6F68]">
                We take utmost care in showcasing our couture, fabrics, embroidery, and silhouettes with high-definition photography. However:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[#7A6F68] pl-2">
                <li>Actual fabric hues may subtly vary depending on your display screen calibrator, brightness settings, or photographic lighting.</li>
                <li>Handcrafted embroidery, handloom weaves, and gota patti work may exhibit slight artisan idiosyncrasies, which are the hallmark of authentic craftsmanship rather than defects.</li>
                <li>Garment size specifications are standardized in inches/centimeters; please refer to our size guide before placing orders.</li>
              </ul>
            </section>

            {/* 3. Pricing & Order Confirmation */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <Scale className="w-5 h-5 text-[#C59A47]" />
                <h2>3. Pricing, Orders & Invoicing</h2>
              </div>
              <p className="text-[#7A6F68]">
                All prices on Ceenai are quoted in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST).
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[#7A6F68] pl-2">
                <li>We reserve the right to revise catalog pricing, promotional offers, and discount schemes without prior notice.</li>
                <li>Receipt of an electronic order confirmation does not signify our final acceptance. We reserve the right to cancel orders arising from inaccurate stock count, pricing discrepancies, or unverified card payments.</li>
                <li>In the unlikely event an order is cancelled after your account has been debited, a full refund will be reversed immediately.</li>
              </ul>
            </section>

            {/* 4. User Accounts & Integrity */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <AlertCircle className="w-5 h-5 text-[#C59A47]" />
                <h2>4. Customer Accounts & Responsibilities</h2>
              </div>
              <p className="text-[#7A6F68]">
                When creating an account on Ceenai, you agree to provide authentic and current contact details. You are responsible for preserving the confidentiality of your account credentials and password. Ceenai shall not be liable for unauthorized transactions executed under your session credentials.
              </p>
            </section>

            {/* 5. Intellectual Property */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <ShieldAlert className="w-5 h-5 text-[#C59A47]" />
                <h2>5. Intellectual Property</h2>
              </div>
              <p className="text-[#7A6F68]">
                All creative content on this website, including but not limited to the brand name &quot;Ceenai&quot;, logo trademarks, product styling photographs, lookbooks, banners, text copy, graphic icons, and site design, is the exclusive proprietary property of Ceenai Lifestyles. Reproduction, republishing, or commercial re-use without explicit written consent is strictly prohibited.
              </p>
            </section>

            {/* 6. Jurisdiction */}
            <section className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#7B1123] font-serif font-bold text-lg">
                <Scale className="w-5 h-5 text-[#C59A47]" />
                <h2>6. Applicable Law & Jurisdiction</h2>
              </div>
              <p className="text-[#7A6F68]">
                These terms, contracts, and any disputes arising out of your purchases shall be governed by and construed in accordance with the laws of the Republic of India. The courts of <strong>Mumbai, Maharashtra</strong> shall have exclusive jurisdiction over any proceedings.
              </p>
            </section>
          </div>

          {/* Right Sidebar: Key Summary */}
          <div className="space-y-6">
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-6 space-y-4">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#2B1A13]">
                <Scale className="w-5 h-5 text-[#7B1123]" />
                <h3>Summary at a Glance</h3>
              </div>
              <ul className="space-y-3 text-xs text-[#7A6F68]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prices include all statutory GST taxes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prepaid transactions secured via 256-bit Razorpay.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Authentic fabrics backed by standard manufacturer checks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Exclusive jurisdiction of Mumbai, Maharashtra.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#2B1A13]">
                <HelpCircle className="w-5 h-5 text-[#7B1123]" />
                <h3>Support & Legal Desk</h3>
              </div>
              <p className="text-xs text-[#7A6F68] leading-relaxed">
                For legal queries or terms clarification, reach out to our administration team:
              </p>
              <div className="pt-2 text-xs space-y-1">
                <p className="text-[#2B1A13] font-semibold">Ceenai Legal Affairs</p>
                <p className="text-[#7A6F68]">Email: <a href={`mailto:${email}`} className="text-[#7B1123] hover:underline font-medium">{email}</a></p>
                <p className="text-[#7A6F68]">Phone: <a href={`tel:${phone}`} className="text-[#7B1123] hover:underline font-medium">+91 {phone}</a></p>
                <p className="text-[#7A6F68] text-[11px] mt-2">Om Kripa CHS, Malad West, Mumbai - 400095</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer categories={categories} settings={settingsMap.footer_settings} />
    </div>
  );
}

