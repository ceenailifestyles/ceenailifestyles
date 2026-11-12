"use client";

import React from "react";
import { Truck, RefreshCw, ShieldCheck, Award } from "lucide-react";

interface BenefitItem {
  title: string;
  subtitle: string;
  icon?: string;
}

export default function BenefitsBar({ benefits = [] }: { benefits?: BenefitItem[] }) {
  if (!benefits || benefits.length === 0) return null;

  // Filter out "Visit Our Store" as requested, leaving 4 core customer shopping benefits
  const filteredBenefits = benefits.filter(
    (item) =>
      !item.title.toLowerCase().includes("visit") &&
      !item.title.toLowerCase().includes("store")
  );

  if (filteredBenefits.length === 0) return null;

  const renderIcon = (name?: string) => {
    switch (name) {
      case "Truck":
        return <Truck className="w-5 h-5 text-[#2B1A13]" />;
      case "RefreshCw":
        return <RefreshCw className="w-5 h-5 text-[#2B1A13]" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-[#2B1A13]" />;
      case "Award":
      default:
        return <Award className="w-5 h-5 text-[#2B1A13]" />;
    }
  };

  return (
    // Mobile: bg color hidden (bg-transparent, border-0). Desktop: full-width bg band (md:bg-[#FAF7F2], md:border-b)
    <section className="w-full bg-transparent md:bg-[#FAF7F2] mt-0 mb-8 sm:mb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-7">
        {/* Mobile: styled as an elevated card (bg-white, rounded-2xl, border, shadow-xs). Desktop: flat transparent row */}
        <div className="bg-white md:bg-transparent border border-[#EFE8DE] md:border-0 rounded-2xl md:rounded-none p-4 sm:p-5 md:p-0 shadow-xs md:shadow-none">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredBenefits.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 sm:gap-3.5 ${
                  idx > 0 ? "md:pl-6" : ""
                }`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF7F2] md:bg-white border border-[#E8DFD5] flex items-center justify-center shrink-0 shadow-2xs">
                  {renderIcon(item.icon)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2B1A13] tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#7A6F68] mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
