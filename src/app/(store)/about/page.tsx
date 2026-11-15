import React from "react";
import Link from "next/link";
import { findCategories } from "@/lib/repositories/category";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { Store, ShieldCheck, Heart, Award, Sparkles, MapPin, Phone } from "lucide-react";

export const revalidate = 120;

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
    description:
      "What began with a passion for stylish nightwear on Amazon has grown into a complete women's fashion and lifestyle destination offering Indian wear, western wear, nightwear, accessories and more.",
    storeImage:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    pillars: [
      { title: "Style", desc: "Trendy & Timeless" },
      { title: "Comfort", desc: "Feels as Good as It Looks" },
      { title: "Value", desc: "Great Fashion at Sensible Prices" },
      { title: "Choice", desc: "A Growing Range for Every Occasion" },
    ],
  };

  const phone = settingsMap.footer_settings?.phone || "9987087055";
  const address =
    settingsMap.footer_settings?.storeAddress ||
    "Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar settings={settingsMap.announcement_bar} />
      <Header categories={categories} />

      {/* Main Container: Full navbar width (max-w-7xl mx-auto px-4 sm:px-6) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 w-full space-y-14">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#7A6F68]">
          <Link href="/" className="hover:text-[#7B1123] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#2B1A13] font-medium">About Us</span>
        </div>

        {/* 2-Column Section: Left-Side Image & Right-Side Content */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Side: Store / Brand Feature Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#EFE8DE] shadow-md bg-[#FAF7F2] aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={about.storeImage}
                alt="Ceenai Brand Story"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badge on Image Bottom */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7B1123] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#F7E7CE]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2B1A13]">Handcrafted Elegance</h4>
                    <p className="text-[11px] text-[#7A6F68]">
                      Designed with love in Mumbai, India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Narrative Copy & Brand Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-widest text-[#C59A47]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Our Heritage & Vision</span>
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2B1A13] tracking-tight">
                {about.heading}
              </h1>
              <h2 className="text-sm sm:text-base font-semibold text-[#7B1123] italic">
                {about.subheading}
              </h2>
            </div>

            <div className="w-16 h-0.5 bg-[#C59A47]" />

            {/* Brand Story Body */}
            <div className="text-xs sm:text-sm text-[#7A6F68] leading-relaxed space-y-4">
              <p className="text-sm sm:text-base text-[#2B1A13] font-medium leading-relaxed">
                {about.description}
              </p>
              <p>
                At Ceenai, we curate women&apos;s apparel and lifestyle couture that seamlessly
                harmonize traditional Indian artisanal craftsmanship with effortless contemporary
                silhouettes. From intricately hand-embroidered anarkalis and comfortable cotton daily
                wear kurtis to modal-satin sleep sets and versatile occasion wear, our designs
                celebrate everyday comfort without compromising on elegance.
              </p>
              <p>
                Every fabric is meticulously chosen for breathability, tactile softness, and lasting
                durability, ensuring you feel confident and radiant whether you are relaxing at home
                or gracing a celebratory gathering.
              </p>
            </div>

            {/* Core Brand Pillars Grid */}
            <div className="pt-4 border-t border-[#EFE8DE] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B1A13]">
                The Ceenai Promise
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {about.pillars?.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-start gap-3 shadow-2xs hover:border-[#7B1123]/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E8DFD5] text-[#7B1123] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#2B1A13]">{p.title}</h4>
                      <p className="text-[11px] text-[#7A6F68] mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Flagship Store Location Banner */}
        <section className="bg-gradient-to-r from-[#FAF7F2] to-white rounded-3xl border border-[#EFE8DE] p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B1123]/10 text-[11px] font-bold text-[#7B1123]">
              <Store className="w-3.5 h-3.5" />
              <span>Flagship Boutique</span>
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2B1A13]">
              Experience Our Fabrics In Person
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6F68] leading-relaxed">
              Visit our Mumbai store to explore our festive edits, touch our premium fabrics, and
              receive bespoke styling assistance from our team.
            </p>
            <div className="flex items-start gap-2 pt-1 text-xs text-[#2B1A13] font-medium">
              <MapPin className="w-4 h-4 text-[#7B1123] shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={`tel:${phone}`}
              className="w-full sm:w-auto px-6 py-3 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl transition-colors text-center shadow-xs flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call +91 {phone}</span>
            </a>
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-[#E8DFD5] hover:border-[#7B1123] text-xs font-semibold text-[#2B1A13] rounded-xl transition-colors text-center shadow-2xs"
            >
              Explore Collection
            </Link>
          </div>
        </section>
      </main>

      <Footer categories={categories} settings={settingsMap.footer_settings} />
    </div>
  );
}
