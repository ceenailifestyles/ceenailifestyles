
import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeConfig = {
  sm: {
    emblem: "h-7 sm:h-8",
    text: "h-4.5 sm:h-5",
    gap: "gap-1",
  },
  md: {
    emblem: "h-9 sm:h-10 md:h-10.5",
    text: "h-6 sm:h-6.5 md:h-7",
    gap: "gap-1.5 sm:gap-2",
  },
  lg: {
    emblem: "h-12 sm:h-13 md:h-14",
    text: "h-8 sm:h-9 md:h-9.5",
    gap: "gap-2",
  },
  xl: {
    emblem: "h-16 sm:h-18",
    text: "h-11 sm:h-12",
    gap: "gap-2.5",
  },
};

export default function Logo({
  className = "",
  variant = "dark",
  size = "md",
}: LogoProps) {
  const isLight = variant === "light";
  const currentSize = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.md;

  return (
    <Link
      href="/"
      className={`inline-flex items-center justify-center shrink-0 select-none ${currentSize.gap} group ${className}`}
      aria-label="Ceenai Home"
    >
      {/* Golden Emblem */}
      <div className="flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Ceenai Emblem"
          className={`${currentSize.emblem} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
        />
      </div>

      {/* Ceenai Brand Name */}
      <div className="flex items-center justify-center mt-0.5">
        <img
          src="/logo-text.png"
          alt="Ceenai"
          className={`${currentSize.text} w-auto object-contain transition-opacity duration-300 ${
            isLight
              ? "brightness-0 invert opacity-95"
              : "brightness-95 contrast-125"
          }`}
        />
      </div>
    </Link>
  );
}
