"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard, { ProductCardData } from "./ProductCard";

interface FeaturedProductsProps {
  initialTabs: {
    featured: ProductCardData[];
    bestSellers: ProductCardData[];
    offers: ProductCardData[];
  };
}

export default function FeaturedProducts({ initialTabs }: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState<"bestSellers" | "newArrivals" | "offers">("bestSellers");

  let displayProducts: ProductCardData[] = [];
  if (activeTab === "bestSellers") {
    displayProducts = initialTabs.bestSellers?.length ? initialTabs.bestSellers : initialTabs.featured;
  } else if (activeTab === "offers") {
    displayProducts = initialTabs.offers?.length ? initialTabs.offers : initialTabs.featured;
  } else {
    displayProducts = initialTabs.featured;
  }

  // Up to 6 products: 5 on desktop, 6 on mobile view
  const visibleProducts = displayProducts.slice(0, 6);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-16">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13] tracking-tight text-center sm:text-left">
            Featured Products
          </h2>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 p-1 bg-[#FAF7F2] rounded-full border border-[#E8DFD5]">
          <button
            onClick={() => setActiveTab("bestSellers")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "bestSellers"
                ? "bg-[#2B1A13] text-white shadow-xs"
                : "text-[#7A6F68] hover:text-[#2B1A13]"
            }`}
          >
            Best Sellers
          </button>
          <button
            onClick={() => setActiveTab("newArrivals")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "newArrivals"
                ? "bg-[#2B1A13] text-white shadow-xs"
                : "text-[#7A6F68] hover:text-[#2B1A13]"
            }`}
          >
            New Arrivals
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "offers"
                ? "bg-[#2B1A13] text-white shadow-xs"
                : "text-[#7A6F68] hover:text-[#2B1A13]"
            }`}
          >
            Offers
          </button>
        </div>
      </div>

      {/* Grid: 6 products on mobile (2 cols x 3 rows), 5 on desktop (5 cols x 1 row) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
        {visibleProducts.map((product, idx) => (
          <div key={product.id} className={idx === 5 ? "lg:hidden" : ""}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* View All Button below product cards */}
      <div className="mt-10 sm:mt-12 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#7B1123] text-white hover:bg-[#630c1b] transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer group"
        >
          <span>View All Products</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

