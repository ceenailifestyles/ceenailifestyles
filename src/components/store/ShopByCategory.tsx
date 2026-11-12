"use client";

import React from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export default function ShopByCategory({ categories = [] }: { categories?: Category[] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-16">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13] tracking-tight">
          Shop by Category
        </h2>
      </div>

      {/* Mobile: 3-column arched grid with 7th item centered. Desktop: 7 tall arched cards row matching user design */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:items-center md:justify-center gap-4 sm:gap-6 md:gap-7">
        {categories.slice(0, 7).map((cat, idx) => {
          const displayName =
            cat.name === "Fashion Accessories" ? "Accessories" : cat.name;
          const isCenteredLast = idx === 6;

          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              prefetch={false}
              className={`group flex flex-col items-center text-center w-full md:w-32 lg:w-36 shrink-0 ${
                isCenteredLast ? "col-start-2 md:col-start-auto" : ""
              }`}
            >
              {/* Image container: tall arched card on mobile and desktop */}
              <div className="w-22 h-28 sm:w-26 sm:h-34 md:w-32 md:h-48 lg:w-36 lg:h-52 rounded-t-full rounded-b-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8DFD5] shadow-xs relative transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md">
                {cat.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FAF7F2] flex items-center justify-center text-xs text-[#7A6F68]">
                    {displayName}
                  </div>
                )}
              </div>

              <span className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-semibold text-[#2B1A13] group-hover:text-[#7B1123] transition-colors line-clamp-2">
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
