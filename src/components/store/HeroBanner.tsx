"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/utils";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  desktopImage: string;
  mobileImage?: string | null;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
}

export default function HeroBanner({ banners = [] }: { banners?: BannerItem[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const activeBanner = banners[currentSlide] || banners[0];

  return (
    <section className="relative w-full overflow-hidden bg-[#24150F]">
      <div className="relative w-full h-[480px] sm:h-[510px] md:h-[540px] lg:h-[570px] xl:h-[600px]">
        {/* Background Images */}
        {banners.map((b, idx) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Desktop Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOptimizedImageUrl(b.desktopImage, { width: 1600 })}
              alt={b.title}
              className="hidden sm:block w-full h-full object-cover object-center"
            />
            {/* Mobile Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOptimizedImageUrl(b.mobileImage || b.desktopImage, { width: 800 })}
              alt={b.title}
              className="sm:hidden w-full h-full object-cover object-top"
            />

            {/* Gradient overlay: bottom-up on mobile, left-to-right on desktop (no white gradient) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent" />
          </div>
        ))}

        {/* Content Container: Mobile is Bottom-Center (justify-end items-center pb-8), Desktop is Left-Center */}
        <div className="relative z-20 max-w-7xl mx-auto h-full px-5 sm:px-10 flex flex-col justify-end pb-8 sm:pb-10 md:justify-center md:pb-0 items-center md:items-start text-center md:text-left">
          <div className="max-w-xl flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-md">
              {activeBanner.title}
            </h1>

            {activeBanner.subtitle && (
              <div className="mt-2 sm:mt-2.5 flex items-center justify-center md:justify-start gap-2">
                <span className="hidden sm:inline-block w-8 h-[1px] bg-white/60" />
                <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-white/90 drop-shadow-xs">
                  {activeBanner.subtitle}
                </p>
                <span className="hidden sm:inline-block w-8 h-[1px] bg-white/60" />
              </div>
            )}

            <div className="mt-4 sm:mt-6 flex justify-center md:justify-start">
              <Link
                href={activeBanner.ctaLink}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs sm:text-sm font-semibold rounded-md shadow-lg transition-all hover:translate-x-1"
              >
                <span>{activeBanner.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Bars: Hidden on mobile (hidden md:flex), centered at bottom on desktop */}
        {banners.length > 1 && (
          <div className="hidden md:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-30 items-center justify-center space-x-2.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentSlide
                    ? "bg-white w-10 shadow-sm"
                    : "bg-white/40 hover:bg-white/70 w-5"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
