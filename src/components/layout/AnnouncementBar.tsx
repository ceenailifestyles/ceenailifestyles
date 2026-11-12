"use client";

import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";

interface AnnouncementProps {
  settings?: {
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  };
}

export default function AnnouncementBar({ settings }: AnnouncementProps) {
  if (settings && settings.isActive === false) return null;

  const address =
    settings?.address ||
    "Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095";
  const phone = settings?.phone || "9987087055";
  const email = settings?.email || "support@ceenai.in";

  return (
    <div className="bg-[#24150F] border-b border-white/10 text-[11px] text-white py-1.5 overflow-hidden">
      {/* Mobile View: Continuous Marquee Moving Right to Left (Phone & Mail Hidden) */}
      <div className="md:hidden flex overflow-hidden whitespace-nowrap w-full">
        <div className="flex animate-marquee shrink-0 items-center">
          {/* Item 1 */}
          <div className="flex items-center gap-2 pr-8 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#C59A47] shrink-0" />
            <span className="text-white font-medium tracking-wide">{address}</span>
            <span className="text-white/30 ml-6">•</span>
          </div>

          {/* Item 2 (Seamless loop pair) */}
          <div className="flex items-center gap-2 pr-8 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#C59A47] shrink-0" />
            <span className="text-white font-medium tracking-wide">{address}</span>
            <span className="text-white/30 ml-6">•</span>
          </div>
        </div>
      </div>

      {/* Desktop View: Static Two-Column Layout (Address on Left, Phone & Email on Right) */}
      <div className="hidden md:flex max-w-7xl mx-auto items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 truncate max-w-xl text-white">
          <MapPin className="w-3.5 h-3.5 text-[#C59A47] shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-6 shrink-0 text-white">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1.5 text-white hover:text-[#FAD7A0] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#C59A47]" />
            <span>{phone}</span>
          </a>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1.5 text-white hover:text-[#FAD7A0] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#C59A47]" />
            <span>{email}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
