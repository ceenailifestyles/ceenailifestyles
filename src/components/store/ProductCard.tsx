"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Heart, ShoppingBag } from "lucide-react";
import { formatINR, getOptimizedImageUrl } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  mainImage: string;
  stock?: number;
  variants?: Array<{
    id?: string;
    size?: string;
    colorName?: string | null;
    stock?: number;
  }>;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isOffer?: boolean;
  rating: number;
  reviewCount: number;
  category?: { name: string; slug: string };
  sizes?: any;
  colors?: any;
}

export default function ProductCard({
  product,
  compact = false,
  onNavigate,
}: {
  product: ProductCardData;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { toggleWishlist, isInWishlist, addToCart } = useStore();
  const wishlisted = isInWishlist(product.id);

  // Determine out-of-stock consistently across products with/without variants
  const isOutOfStock = React.useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const totalVariantStock = product.variants.reduce(
        (acc: number, v: any) => acc + (Number(v.stock) || 0),
        0
      );
      return totalVariantStock <= 0;
    }
    if (typeof product.stock === "number") {
      return product.stock <= 0;
    }
    return false;
  }, [product.stock, product.variants]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent out-of-stock products from being added to the cart
    if (isOutOfStock) return;

    // Default to first size if available
    const availableSizes = Array.isArray(product.sizes) ? (product.sizes as string[]) : [];
    const availableColors = Array.isArray(product.colors) ? (product.colors as string[]) : [];

    if (onNavigate) onNavigate();

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      originalPrice: product.originalPrice,
      image: product.mainImage,
      size: availableSizes[0] || undefined,
      color: availableColors[0] || undefined,
      quantity: 1,
      maxStock: typeof product.stock === "number" ? product.stock : undefined,
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      className={`group relative bg-white border border-[#EFE8DE] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col ${
        compact ? "rounded-xl" : "rounded-2xl"
      }`}
    >
      {/* Image Container */}
      <div
        className={`relative w-full bg-[#FAF7F2] overflow-hidden ${
          compact ? "h-36" : "aspect-3/4"
        }`}
      >
        <Link
          href={`/products/${product.slug}`}
          prefetch={false}
          onClick={onNavigate}
          className="block w-full h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getOptimizedImageUrl(product.mainImage, { width: 400 })}
            alt={product.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badge */}
        <div
          className={`absolute z-10 flex flex-col gap-1 ${
            compact ? "top-2 left-2" : "top-2.5 left-2.5"
          }`}
        >
          {isOutOfStock ? (
            <span
              className={`font-bold uppercase tracking-wider bg-[#2B1A13]/90 text-white rounded-md shadow-xs ${
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
            >
              Out of Stock
            </span>
          ) : product.discount > 0 ? (
            <span
              className={`font-bold uppercase tracking-wider bg-[#E51D39] text-white rounded-md shadow-xs ${
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
            >
              {product.discount}% OFF
            </span>
          ) : product.isNewArrival ? (
            <span
              className={`font-bold uppercase tracking-wider bg-[#C59A47] text-white rounded-md shadow-xs ${
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
            >
              New
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute z-10 rounded-full backdrop-blur-xs transition-colors shadow-xs ${
            compact ? "top-2 right-2 p-1.5" : "top-2.5 right-2.5 p-2"
          } ${
            wishlisted
              ? "bg-[#7B1123] text-white"
              : "bg-white/80 text-[#2B1A13] hover:bg-white hover:text-[#7B1123]"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${
              wishlisted ? "fill-current" : ""
            }`}
          />
        </button>
      </div>

      {/* Product Details */}
      <div
        className={`flex flex-col flex-1 justify-between ${
          compact ? "p-2.5" : "p-3.5"
        }`}
      >
        <div>
          <Link
            href={`/products/${product.slug}`}
            prefetch={false}
            onClick={onNavigate}
            className="block"
          >
            <h3
              className={`font-medium text-[#2B1A13] group-hover:text-[#7B1123] transition-colors line-clamp-1 ${
                compact ? "text-xs" : "text-xs sm:text-[13px]"
              }`}
            >
              {product.name}
            </h3>
          </Link>

          {/* Pricing & Add to Cart button */}
          <div
            className={`flex items-center justify-between ${
              compact ? "mt-1.5" : "mt-2"
            }`}
          >
            <div className="flex items-baseline gap-1 flex-wrap">
              <span
                className={`font-bold text-[#2B1A13] ${
                  compact ? "text-xs" : "text-xs sm:text-sm"
                }`}
              >
                {formatINR(product.sellingPrice)}
              </span>
              {product.originalPrice > product.sellingPrice && (
                <span
                  className={`text-[#7A6F68] line-through ${
                    compact ? "text-[10px]" : "text-[11px]"
                  }`}
                >
                  {formatINR(product.originalPrice)}
                </span>
              )}
              {isOutOfStock && (
                <span className="text-[10px] font-bold text-[#C93B2B] block w-full mt-0.5 uppercase tracking-wider">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Quick Add To Cart */}
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`rounded-lg shadow-xs transition-colors shrink-0 ${
                isOutOfStock
                  ? "bg-[#E8DFD5] text-[#A89F91] cursor-not-allowed border border-[#D8CFBF]"
                  : "bg-[#2B1A13] hover:bg-[#7B1123] text-white cursor-pointer"
              } ${
                compact ? "p-1.5" : "p-1.5 sm:p-2"
              }`}
              title={isOutOfStock ? "Out of Stock" : "Add to Bag"}
              aria-label={isOutOfStock ? "Out of Stock" : "Add to Bag"}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

