"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CollectionItem {
  id: string;
  title?: string;
  name?: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  bannerImage?: string | null;
}

export default function PromoBanners({ collections = [] }: { collections?: CollectionItem[] }) {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {collections.slice(0, 2).map((col, idx) => {
          const isDark = idx % 2 !== 0;

          return (
            <div
              key={col.id}
              className={`relative rounded-2xl overflow-hidden shadow-xs group min-h-[220px] sm:min-h-[260px] flex ${
                isDark
                  ? "bg-[#6A101C] text-white"
                  : "bg-[#FAF7F2] border border-[#EFE8DE] text-[#2B1A13]"
              }`}
            >
              <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center z-10 max-w-[65%]">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isDark ? "text-[#F7E7CE]" : "text-[#C59A47]"
                  }`}
                >
                  Featured
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                  {col.title || col.name}
                </h3>
                {col.description && (
                  <p
                    className={`text-xs mt-1 mb-4 ${
                      isDark ? "text-[#F7E7CE]/90" : "text-[#7A6F68]"
                    }`}
                  >
                    {col.description}
                  </p>
                )}
                <div>
                  <Link
                    href={`/products?collection=${col.slug}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors group-hover:translate-x-1 ${
                      isDark
                        ? "text-white hover:text-[#F7E7CE]"
                        : "text-[#7B1123] hover:text-[#2B1A13]"
                    }`}
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {(col.bannerImage || col.image) && (
                <div className="w-[45%] absolute right-0 top-0 bottom-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.bannerImage || col.image || ""}
                    alt={col.title || col.name || "Collection"}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
