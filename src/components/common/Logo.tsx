
import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | string;
}

export default function Logo({
  className = "",
  variant = "dark",
}: LogoProps) {
  const isLight = variant === "light";

  return (
    <Link
      href="/"
      className={`inline-flex flex items-center justify-center shrink-0 select-none gap-1 group ${className}`}
      aria-label="Ceenai Home"
    >
      {/* Golden Emblem */}
      <div className="flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Ceenai Emblem"
          className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Ceenai Brand Name */}
      <div className="flex items-center justify-center mt-1">
        <img
          src="/logo-text.png"
          alt="Ceenai"
          className={`h-6 w-auto object-contain transition-opacity duration-300 ${
            isLight
              ? "brightness-0 invert opacity-95"
              : "brightness-95 contrast-125"
          }`}
        />
      </div>
    </Link>
  );
}
