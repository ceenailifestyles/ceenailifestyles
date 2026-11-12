"use client";

import React from "react";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";

interface ShopBannerProps {
  category?: {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
  } | null;
  subcategory?: {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
  } | null;
  collectionTitle?: string | null;
  searchQuery?: string | null;
}

const DEFAULT_SHOP_BANNER = {
  title: "View All Products",
  description:
    "Explore our complete curated collection of timeless couture, everyday elegance, and festive fashion crafted for the modern Indian woman.",
  image:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85",
  badge: "Complete Catalog",
};

export default function ShopBanner({
  category,
  subcategory,
  collectionTitle,
  searchQuery,
}: ShopBannerProps) {
  // Determine banner content dynamically
  let bannerTitle = DEFAULT_SHOP_BANNER.title;
  let bannerDescription = DEFAULT_SHOP_BANNER.description;
  let bannerImage = DEFAULT_SHOP_BANNER.image;
  let bannerBadge = DEFAULT_SHOP_BANNER.badge;

  if (category) {
    bannerTitle = subcategory
      ? `${category.name} — ${subcategory.name}`
      : category.name;
    // Prioritize subcategory description if provided, otherwise fallback to parent category
    bannerDescription =
      subcategory?.description ||
      category.description ||
      `Discover handpicked ${category.name.toLowerCase()} featuring exquisite craftsmanship and modern silhouettes.`;
    // Prioritize subcategory image uploaded from admin, otherwise fallback to parent category
    bannerImage =
      subcategory?.image ||
      category.image ||
      DEFAULT_SHOP_BANNER.image;
    bannerBadge = subcategory ? subcategory.name : "Category Collection";
  } else if (collectionTitle) {
    bannerTitle = collectionTitle;
    bannerDescription =
      collectionTitle === "Festive Edit"
        ? "Celebrate every special occasion in splendor with rich fabrics, golden zari work, and royal festive ensembles."
        : "Be the first to wear the season's newest couture releases and runway-inspired styles.";
    bannerImage =
      collectionTitle === "Festive Edit"
        ? "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85"
        : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1920&q=85";
    bannerBadge = "Curated Collection";
  } else if (searchQuery) {
    bannerTitle = `Results for "${searchQuery}"`;
    bannerDescription =
      "Browse all matching styles found across our collections, categories, and designer edits.";
    bannerImage = DEFAULT_SHOP_BANNER.image;
    bannerBadge = "Search Catalog";
  }

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 shadow-sm border border-[#E8DFD5] bg-[#24150F]">
      {/* Background Landscape Image */}
      <div className="relative h-44 sm:h-56 md:h-64 lg:h-72 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerImage}
          alt={bannerTitle}
          className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-700 ease-out"
        />

        {/* Multi-layer luxury editorial gradients for crisp text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-14 z-10 max-w-3xl">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C59A47] text-white shadow-xs">
              <Tag className="w-3 h-3" />
              <span>{bannerBadge}</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-sm line-clamp-2 sm:line-clamp-none">
            {bannerTitle}
          </h1>

          {/* Short Description */}
          {bannerDescription && (
            <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed mt-1.5 sm:mt-2.5 max-w-xl line-clamp-2 drop-shadow-xs">
              {bannerDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
