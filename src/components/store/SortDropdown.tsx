"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function SortDropdown({
  currentSort = "newest",
  className = "",
}: {
  currentSort?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentOption =
    SORT_OPTIONS.find((opt) => opt.value === currentSort) || SORT_OPTIONS[0];

  const handleSelect = (value: string) => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-flex items-center gap-1.5 sm:gap-2 text-xs ${className}`}
    >
      <span className="text-[#7A6F68] font-medium whitespace-nowrap text-xs">
        Sort by:
      </span>

      {/* Custom Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 sm:py-2 bg-white border rounded-lg text-xs font-semibold text-[#2B1A13] transition-all cursor-pointer shadow-2xs select-none ${
          isOpen
            ? "border-[#7B1123] ring-2 ring-[#7B1123]/10"
            : "border-[#E8DFD5] hover:border-[#7B1123]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="whitespace-nowrap">{currentOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A6F68] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#7B1123]" : ""
          }`}
        />
      </button>

      {/* Floating Custom Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[175px] bg-white border border-[#E8DFD5] rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === currentOption.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#FAF7F2] text-[#7B1123] font-semibold"
                    : "text-[#2B1A13] hover:bg-[#FAF7F2] hover:text-[#7B1123]"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#7B1123] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
