"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Heart, Smile } from "lucide-react";

interface AboutProps {
  content?: {
    heading?: string;
    subheading?: string;
    description?: string;
    storeImage?: string;
    ctaText?: string;
    ctaLink?: string;
    pillars?: { title: string; desc: string }[];
  };
}

export default function AboutCeeneai({ content }: AboutProps) {
  if (!content) return null;

  const renderPillarIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case "style":
        return <Heart className="w-5 h-5 text-[#C59A47]" />;
      case "comfort":
        return <Smile className="w-5 h-5 text-[#C59A47]" />;
      default:
        return <Heart className="w-5 h-5 text-[#C59A47]" />;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-12 sm:my-20">
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#EFE8DE] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Store Image */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-sm aspect-4/3 max-h-[380px] bg-white border border-[#E8DFD5]">
            <img
              src={content.storeImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"}
              alt="Ceenai Boutique"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Story & 4 Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B1A13] tracking-tight">
                {content.heading || "About Ceenai"}
              </h2>
              <p className="font-serif italic text-sm sm:text-base text-[#C59A47] mt-1">
                {content.subheading || "A Story That Begins With You."}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#7A6F68] leading-relaxed">
              {content.description ||
                "What began with a passion for stylish nightwear on Amazon has grown into a complete women's fashion and lifestyle destination offering Indian wear, western wear, nightwear, accessories and more."}
            </p>

            {/* 4 Pillars Grid */}
            {content.pillars && content.pillars.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                {content.pillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-xl border border-[#E8DFD5]/80 shadow-2xs flex items-center gap-3"
                  >
                    <div className="shrink-0">{renderPillarIcon(pillar.title)}</div>
                    <div>
                      <h4 className="text-xs font-bold text-[#2B1A13]">{pillar.title}</h4>
                      <p className="text-[11px] text-[#7A6F68] line-clamp-1">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {content.ctaLink && (
              <div className="pt-2">
                <Link
                  href={content.ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B1A13] text-white text-xs font-semibold rounded-full hover:bg-[#7B1123] transition-colors shadow-xs"
                >
                  <span>{content.ctaText || "Know Our Story"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
