"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import FilterSidebar from "./FilterSidebar";
import SortDropdown from "./SortDropdown";

interface MobileFilterDrawerProps {
  categories: any[];
  totalCount: number;
  currentSort?: string;
}

export default function MobileFilterDrawer({
  categories,
  totalCount,
  currentSort = "newest",
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Count active filters (ignoring sort and page)
  const activeCount = Array.from(searchParams.keys()).filter(
    (k) => k !== "sort" && k !== "page"
  ).length;

  const handleClearAll = () => {
    router.push("/products", { scroll: false });
  };

  return (
    <>
      {/* Mobile Filter & Sort Bar (On the EXACT same line) */}
      <div className="lg:hidden flex items-center justify-between gap-2 mb-6 bg-white p-2.5 sm:p-3 rounded-xl border border-[#EFE8DE] shadow-xs">
        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#FAF7F2] text-[#2B1A13] border border-[#E8DFD5] rounded-lg text-xs font-semibold hover:border-[#7B1123] active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
          aria-label="Open Filters Drawer"
        >
          <Filter className="w-3.5 h-3.5 text-[#7B1123]" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 bg-[#7B1123] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </button>

        {/* Product Count (visible on wider mobile / small tablets) */}
        <span className="text-[11px] text-[#7A6F68] font-medium hidden sm:inline truncate">
          Showing <strong>{totalCount}</strong> products
        </span>

        {/* Sort By Dropdown (Same line as Filter button) */}
        <SortDropdown currentSort={currentSort} className="shrink-0" />
      </div>

      {/* Slide-in Bottom Sheet Drawer (Bottom to Top) */}
      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] lg:hidden flex flex-col justify-end">
            {/* Backdrop Overlay */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
              aria-label="Close filters backdrop"
            />

            {/* Bottom-to-Top Sheet Modal */}
            <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col z-10 animate-slide-up border-t border-[#E8DFD5]">
              {/* Swipe/Grab Indicator */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-[#D4C7B8] rounded-full" />
              </div>

              {/* Drawer Header */}
              <div className="p-4 px-6 border-b border-[#EFE8DE] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#7B1123]" />
                  <h3 className="font-bold text-sm text-[#2B1A13]">Filter Products</h3>
                  {activeCount > 0 && (
                    <span className="w-5 h-5 bg-[#7B1123] text-white text-[11px] font-bold rounded-full flex items-center justify-center leading-none">
                      {activeCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-semibold text-[#7B1123] hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-[#7A6F68] hover:text-[#2B1A13] rounded-full hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                <FilterSidebar
                  categories={categories}
                  totalCount={totalCount}
                  isMobile
                />
              </div>

              {/* Sticky Bottom Apply Action */}
              <div className="p-4 px-6 border-t border-[#EFE8DE] bg-[#FAF7F2] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-[#7B1123] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#630c1b] active:scale-98 transition-all tracking-wide cursor-pointer"
                >
                  Apply Filters ({totalCount} Products)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
