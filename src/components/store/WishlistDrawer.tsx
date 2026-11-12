"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { X, Heart, Trash2, ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/utils";
import ProductCard from "@/components/store/ProductCard";

let cachedWishlistProducts: any[] | null = null;

export default function WishlistDrawer() {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    wishlistCount,
  } = useStore();

  const [allProducts, setAllProducts] = useState<any[]>(cachedWishlistProducts || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isWishlistOpen) return;
    if (cachedWishlistProducts && cachedWishlistProducts.length > 0) {
      setAllProducts(cachedWishlistProducts);
      return;
    }

    let active = true;
    setLoading(true);
    fetch("/api/store/products?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.products)) {
          cachedWishlistProducts = data.products;
          setAllProducts(data.products);
        }
      })
      .catch((err) => console.error("Wishlist drawer fetch error:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isWishlistOpen]);

  if (!isWishlistOpen) return null;

  const wishlistedProducts = allProducts.filter((p) => wishlist.includes(p.id));
  const sliderProducts =
    allProducts.filter((p) => !wishlist.includes(p.id)).length > 0
      ? allProducts.filter((p) => !wishlist.includes(p.id)).slice(0, 10)
      : allProducts.slice(0, 10);
  const marqueeItems =
    sliderProducts.length > 0 ? [...sliderProducts, ...sliderProducts] : [];

  const handleMoveToBag = (product: any) => {
    const availableSizes = Array.isArray(product.sizes)
      ? (product.sizes as string[])
      : [];
    const availableColors = Array.isArray(product.colors)
      ? (product.colors as string[])
      : [];

    setIsWishlistOpen(false);
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      originalPrice: product.originalPrice,
      image: product.mainImage,
      size: availableSizes[0] || undefined,
      color: availableColors[0] || undefined,
      quantity: 1,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsWishlistOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white h-full max-h-dvh overflow-hidden flex flex-col shadow-2xl relative animate-slide-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 px-6 border-b border-[#EFE8DE] flex items-center justify-between bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#7B1123] fill-current" />
            <h2 className="font-serif font-bold text-base text-[#2B1A13]">
              My Wishlist
            </h2>
            <span className="text-xs bg-[#7B1123] text-white px-2 py-0.5 rounded-full font-medium">
              {wishlistCount}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsWishlistOpen(false)}
            className="p-1.5 text-[#7A6F68] hover:text-[#2B1A13] hover:bg-[#EFE8DE]/60 rounded-full transition-colors cursor-pointer"
            aria-label="Close wishlist drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Item List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#7B1123] mb-3">
                <Heart className="w-7 h-7 opacity-40" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#2B1A13]">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-[#7A6F68] max-w-xs mt-1 mb-5">
                Tap the heart icon on any outfit or accessory to save your favorite styles here.
              </p>
              <button
                type="button"
                onClick={() => setIsWishlistOpen(false)}
                className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          ) : loading && wishlistedProducts.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#7A6F68]">
              Loading your saved items...
            </div>
          ) : (
            wishlistedProducts.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 rounded-xl border border-[#EFE8DE] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors"
              >
                <Link
                  href={`/products/${item.slug}`}
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.mainImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123] line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.id)}
                        className="text-[#7A6F68] hover:text-red-600 transition-colors cursor-pointer"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.category?.name && (
                      <span className="text-[10px] text-[#7A6F68] block mt-0.5">
                        {item.category.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8DFD5]/60">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-[#7B1123]">
                        {formatINR(item.sellingPrice)}
                      </span>
                      {item.originalPrice > item.sellingPrice && (
                        <span className="text-[10px] text-[#7A6F68] line-through">
                          {formatINR(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToBag(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B1A13] hover:bg-[#7B1123] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Fixed Section: Continuous Product Slider + Footer Action (No Y-Axis Scroll) */}
        <div className="shrink-0 overflow-hidden bg-[#FAF7F2]">
          {marqueeItems.length > 0 && (
            <div className="pt-3 pb-2.5 overflow-hidden">
              <div className="px-5 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6F68]">
                  You May Also Love
                </span>
                <Link
                  href="/products"
                  onClick={() => setIsWishlistOpen(false)}
                  className="text-[10px] font-semibold text-[#7B1123] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="relative w-full overflow-hidden">
                <div className="animate-marquee flex items-stretch gap-3 px-3 hover:[animation-play-state:paused]">
                  {marqueeItems.map((prod, idx) => (
                    <div
                      key={`${prod.id}-${idx}`}
                      className="w-[158px] sm:w-[168px] shrink-0"
                    >
                      <ProductCard
                        product={prod}
                        compact
                        onNavigate={() => setIsWishlistOpen(false)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {wishlist.length > 0 && (
            <div className="px-5 pb-4 pt-2 border-t border-[#EFE8DE]/70">
              <Link
                href="/wishlist"
                onClick={() => setIsWishlistOpen(false)}
                className="w-full py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center transition-colors"
              >
                View Full Wishlist
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

