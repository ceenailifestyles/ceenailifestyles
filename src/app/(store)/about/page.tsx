import React from "react";
import { findCategories } from "@/lib/repositories/category";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { Store, ShieldCheck, Heart, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [categories, siteSettings] = await Promise.all([
    findCategories({
      where: { parentId: null, isActive: true },
      orderBy: { displayOrder: "asc" },
      includeChildren: true,
    }),
    findSiteSettings({
      key: { in: ["about_ceenai", "footer_settings", "announcement_bar"] },
    }),
  ]);

  const settingsMap: Record<string, any> = {};
  for (const s of siteSettings) {
    settingsMap[s.key] = s.value;
  }

  const about = settingsMap.about_ceenai || {
    heading: "About Ceenai",
    subheading: "A Story That Begins With You.",
    description: "What began with a passion for stylish nightwear on Amazon has grown into a complete women's fashion and lifestyle destination offering Indian wear, western wear, nightwear, accessories and more.",
    storeImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    pillars: [
      { title: "Style", desc: "Trendy & Timeless" },
      { title: "Comfort", desc: "Feels as Good as It Looks" },
      { title: "Value", desc: "Great Fashion at Sensible Prices" },
      { title: "Choice", desc: "A Growing Range for Every Occasion" },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar settings={settingsMap.announcement_bar} />
      <Header categories={categories} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-widest text-[#C59A47]">
            Our Heritage & Vision
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B1A13] mt-2">
            {about.heading}
          </h1>
          <h2 className="text-sm font-semibold text-[#7B1123] italic mt-1">
            {about.subheading}
          </h2>
          <div className="w-12 h-0.5 bg-[#C59A47] mx-auto mt-4" />
        </div>

        <div className="bg-white rounded-3xl border border-[#EFE8DE] p-6 sm:p-10 shadow-xs space-y-8">
          <div className="aspect-16/9 rounded-2xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={about.storeImage} alt="Ceenai Story" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-sm max-w-none text-[#7A6F68] leading-relaxed space-y-4">
            <p className="text-sm text-[#2B1A13] font-medium leading-relaxed">
              {about.description}
            </p>
            <p>
              At Ceenai, we curate women&apos;s apparel and lifestyle accessories that bridge traditional Indian craftsmanship with effortless contemporary silhouettes. From intricately hand-embroidered anarkalis and comfortable cotton daily kurtis to modal-satin sleep sets and hypoallergenic women&apos;s essentials, our designs celebrate everyday comfort without compromising on poise.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#EFE8DE]">
            {about.pillars?.map((p: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <Award className="w-5 h-5 text-[#7B1123] mx-auto mb-2" />
                <h4 className="text-xs font-bold text-[#2B1A13]">{p.title}</h4>
                <p className="text-[11px] text-[#7A6F68] mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Store Location */}
        <div className="bg-white rounded-3xl border border-[#EFE8DE] p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Visit Our Flagship Store</h3>
            <p className="text-xs text-[#7A6F68]">
              Experience our fabrics and festive collections in person in Mumbai.
            </p>
            <p className="text-xs text-[#2B1A13] font-semibold mt-2">
              Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:9987087055"
              className="px-5 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors text-center"
            >
              Call 9987087055
            </a>
          </div>
        </div>
      </main>

      <Footer settings={settingsMap.footer_settings} />
    </div>
  );
}
