"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface FilterSidebarProps {
  categories: {
    id: string;
    name: string;
    slug: string;
    children?: { id: string; name: string; slug: string }[];
  }[];
  totalCount: number;
  isMobile?: boolean;
}

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 100;

export default function FilterSidebar({
  categories,
  totalCount,
  isMobile = false,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected filters from URL
  const selectedCategory = searchParams.get("category") || "";
  const selectedSubcategory = searchParams.get("subcategory") || "";
  const selectedMinPrice = searchParams.get("minPrice") || "";
  const selectedMaxPrice = searchParams.get("maxPrice") || "";
  const selectedSize = searchParams.get("size") || "";
  const selectedInStock = searchParams.get("inStock") === "true";
  const selectedDiscount = searchParams.get("discount") || "";

  // Local price range slider state
  const [localMin, setLocalMin] = useState(
    selectedMinPrice ? parseInt(selectedMinPrice, 10) : PRICE_MIN
  );
  const [localMax, setLocalMax] = useState(
    selectedMaxPrice ? parseInt(selectedMaxPrice, 10) : PRICE_MAX
  );

  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    size: true,
    stock: true,
    discount: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper: build updated URL from current params + overrides, then navigate
  const applyFilters = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const updateFilter = (key: string, value: string | null) => {
    applyFilters({ [key]: value });
  };

  const clearAllFilters = () => {
    router.push("/products", { scroll: false });
  };

  const hasActiveFilters = Boolean(
    selectedCategory ||
      selectedSubcategory ||
      selectedMinPrice ||
      selectedMaxPrice ||
      selectedSize ||
      selectedInStock ||
      selectedDiscount
  );

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

  // --- Price Range Slider debounce ---
  const priceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitPriceRange = useCallback(
    (min: number, max: number) => {
      if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
      priceTimerRef.current = setTimeout(() => {
        applyFilters({
          minPrice: min > PRICE_MIN ? min.toString() : null,
          maxPrice: max < PRICE_MAX ? max.toString() : null,
        });
      }, 400);
    },
    [applyFilters]
  );

  const handleMinChange = (val: number) => {
    const clamped = Math.min(val, localMax - PRICE_STEP);
    setLocalMin(clamped);
    commitPriceRange(clamped, localMax);
  };

  const handleMaxChange = (val: number) => {
    const clamped = Math.max(val, localMin + PRICE_STEP);
    setLocalMax(clamped);
    commitPriceRange(localMin, clamped);
  };

  // Sync local slider with URL params when they change externally
  useEffect(() => {
    setLocalMin(selectedMinPrice ? parseInt(selectedMinPrice, 10) : PRICE_MIN);
    setLocalMax(selectedMaxPrice ? parseInt(selectedMaxPrice, 10) : PRICE_MAX);
  }, [selectedMinPrice, selectedMaxPrice]);

  // Dynamic sticky offset: if filter box is taller than viewport, let it scroll until its
  // bottom reaches the bottom of the viewport, then lock it sticky in place while products scroll.
  const asideRef = useRef<HTMLElement | null>(null);
  const [stickyTop, setStickyTop] = useState<number>(96);

  useEffect(() => {
    if (isMobile) return;
    const el = asideRef.current;
    if (!el) return;

    const updateStickyPosition = () => {
      const viewportHeight = window.innerHeight;
      const sidebarHeight = el.offsetHeight;
      const headerOffset = 96; // 6rem below sticky header
      const bottomOffset = 24; // 1.5rem breathing room at bottom of viewport

      if (sidebarHeight + headerOffset + bottomOffset > viewportHeight) {
        setStickyTop(viewportHeight - sidebarHeight - bottomOffset);
      } else {
        setStickyTop(headerOffset);
      }
    };

    updateStickyPosition();

    const resizeObserver = new ResizeObserver(updateStickyPosition);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateStickyPosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateStickyPosition);
    };
  }, [isMobile]);

  // Price slider track fill percentage
  const minPercent = ((localMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const maxPercent = ((localMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <aside
      ref={asideRef}
      style={!isMobile ? { top: `${stickyTop}px` } : undefined}
      className={
        isMobile
          ? "w-full bg-transparent p-0 shadow-none border-0"
          : "w-64 shrink-0 bg-white rounded-2xl border border-[#EFE8DE] p-5 shadow-xs h-fit sticky"
      }
    >
      {/* Header - shown only on desktop as mobile drawer provides its own top header */}
      {!isMobile && (
        <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#7B1123]" />
            <h2 className="text-sm font-bold text-[#2B1A13]">Filters</h2>
            <span className="text-[11px] bg-[#FAF7F2] text-[#7A6F68] px-2 py-0.5 rounded-full border border-[#E8DFD5]">
              {totalCount} products
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-[#7B1123] hover:underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      <div className="space-y-4 py-2 divide-y divide-[#EFE8DE]/60">
        {/* 1. Category & Subcategory (FIX: batch both params in one push) */}
        <div className="pt-3">
          <button
            onClick={() => toggleSection("category")}
            className="w-full flex items-center justify-between text-xs font-bold text-[#2B1A13] mb-2 cursor-pointer"
          >
            <span>Category</span>
            {openSections.category ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {openSections.category && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {/* "All Categories" option */}
              <div className="text-xs">
                <button
                  type="button"
                  onClick={() =>
                    applyFilters({ category: null, subcategory: null })
                  }
                  className={`flex items-center gap-2 w-full text-left cursor-pointer py-1 px-1 rounded-md transition-colors ${
                    !selectedCategory
                      ? "bg-[#7B1123]/5 text-[#7B1123] font-semibold"
                      : "text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2]"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      !selectedCategory
                        ? "border-[#7B1123] bg-[#7B1123]"
                        : "border-[#D8CFBF] bg-transparent"
                    }`}
                  >
                    {!selectedCategory && (
                      <span className="block w-1 h-1 bg-white rounded-full m-auto mt-[3px]" />
                    )}
                  </span>
                  <span>All Categories</span>
                </button>
              </div>

              {categories.map((cat) => (
                <div key={cat.id} className="text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      applyFilters({
                        category:
                          selectedCategory === cat.slug ? null : cat.slug,
                        subcategory: null,
                      })
                    }
                    className={`flex items-center gap-2 w-full text-left cursor-pointer py-1 px-1 rounded-md transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-[#7B1123]/5 text-[#7B1123] font-semibold"
                        : "text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                        selectedCategory === cat.slug
                          ? "border-[#7B1123] bg-[#7B1123]"
                          : "border-[#D8CFBF] bg-transparent"
                      }`}
                    >
                      {selectedCategory === cat.slug && (
                        <span className="block w-1 h-1 bg-white rounded-full m-auto mt-[3px]" />
                      )}
                    </span>
                    <span>{cat.name}</span>
                  </button>

                  {/* Subcategories if category selected */}
                  {selectedCategory === cat.slug &&
                    cat.children &&
                    cat.children.length > 0 && (
                      <div className="pl-5 space-y-1 my-1 border-l-2 border-[#7B1123]/20">
                        {cat.children.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() =>
                              updateFilter(
                                "subcategory",
                                selectedSubcategory === sub.slug
                                  ? null
                                  : sub.slug
                              )
                            }
                            className={`flex items-center gap-1.5 cursor-pointer text-[11px] w-full text-left py-0.5 px-1 rounded transition-colors ${
                              selectedSubcategory === sub.slug
                                ? "font-semibold text-[#7B1123] bg-[#7B1123]/5"
                                : "text-[#7A6F68] hover:text-[#7B1123]"
                            }`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full border shrink-0 ${
                                selectedSubcategory === sub.slug
                                  ? "border-[#7B1123] bg-[#7B1123]"
                                  : "border-[#D8CFBF] bg-transparent"
                              }`}
                            />
                            <span>{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Price Range — Dual-thumb Range Slider */}
        <div className="pt-3">
          <button
            onClick={() => toggleSection("price")}
            className="w-full flex items-center justify-between text-xs font-bold text-[#2B1A13] mb-2 cursor-pointer"
          >
            <span>Price Range</span>
            {openSections.price ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {openSections.price && (
            <div className="space-y-3 px-0.5">
              {/* Price labels */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7B1123]">
                  {formatINR(localMin)}
                </span>
                <span className="text-[10px] text-[#7A6F68]">—</span>
                <span className="text-xs font-semibold text-[#7B1123]">
                  {localMax >= PRICE_MAX ? `${formatINR(PRICE_MAX)}+` : formatINR(localMax)}
                </span>
              </div>

              {/* Dual range slider */}
              <div className="relative h-6 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-1.5 bg-[#EFE8DE] rounded-full" />

                {/* Active range fill */}
                <div
                  className="absolute h-1.5 bg-[#7B1123] rounded-full"
                  style={{
                    left: `${minPercent}%`,
                    right: `${100 - maxPercent}%`,
                  }}
                />

                {/* Min thumb */}
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={localMin}
                  onChange={(e) => handleMinChange(parseInt(e.target.value, 10))}
                  className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none z-10
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:pointer-events-auto
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#7B1123]
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:pointer-events-auto
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#7B1123]
                    [&::-moz-range-thumb]:shadow-md
                    [&::-moz-range-thumb]:cursor-pointer
                  "
                />

                {/* Max thumb */}
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={localMax}
                  onChange={(e) => handleMaxChange(parseInt(e.target.value, 10))}
                  className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none z-20
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:pointer-events-auto
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#7B1123]
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:pointer-events-auto
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#7B1123]
                    [&::-moz-range-thumb]:shadow-md
                    [&::-moz-range-thumb]:cursor-pointer
                  "
                />
              </div>

              {/* Reset price */}
              {(localMin > PRICE_MIN || localMax < PRICE_MAX) && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalMin(PRICE_MIN);
                    setLocalMax(PRICE_MAX);
                    applyFilters({ minPrice: null, maxPrice: null });
                  }}
                  className="text-[10px] text-[#7B1123] font-semibold hover:underline cursor-pointer"
                >
                  Reset Price
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Sizes */}
        <div className="pt-3">
          <button
            onClick={() => toggleSection("size")}
            className="w-full flex items-center justify-between text-xs font-bold text-[#2B1A13] mb-2 cursor-pointer"
          >
            <span>Size</span>
            {openSections.size ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {openSections.size && (
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => updateFilter("size", selectedSize === s ? null : s)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                    selectedSize === s
                      ? "bg-[#7B1123] text-white border-[#7B1123] font-semibold"
                      : "bg-[#FAF7F2] text-[#2B1A13] border-[#E8DFD5] hover:border-[#7B1123]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Discount */}
        <div className="pt-3">
          <button
            onClick={() => toggleSection("discount")}
            className="w-full flex items-center justify-between text-xs font-bold text-[#2B1A13] mb-2 cursor-pointer"
          >
            <span>Discount</span>
            {openSections.discount ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {openSections.discount && (
            <div className="space-y-1">
              {[10, 20, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    updateFilter(
                      "discount",
                      selectedDiscount === d.toString() ? null : d.toString()
                    )
                  }
                  className={`flex items-center gap-2 text-xs w-full text-left cursor-pointer py-1 px-1 rounded-md transition-colors ${
                    selectedDiscount === d.toString()
                      ? "text-[#7B1123] font-semibold bg-[#7B1123]/5"
                      : "text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2]"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      selectedDiscount === d.toString()
                        ? "border-[#7B1123] bg-[#7B1123]"
                        : "border-[#D8CFBF] bg-transparent"
                    }`}
                  />
                  <span>{d}% or more</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Availability */}
        <div className="pt-3">
          <label className="flex items-center gap-2 text-xs font-bold text-[#2B1A13] cursor-pointer">
            <input
              type="checkbox"
              checked={selectedInStock}
              onChange={(e) => updateFilter("inStock", e.target.checked ? "true" : null)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm"
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
