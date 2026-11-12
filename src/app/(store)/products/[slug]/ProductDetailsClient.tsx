"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  Heart,
  ShoppingBag,
  Truck,
  RefreshCw,
  ShieldCheck,
  Check,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Variant {
  id: string;
  colorName?: string | null;
  colorHex?: string | null;
  size: string;
  stock: number;
  sku?: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  colorName?: string | null;
  displayOrder: number;
}

export default function ProductDetailsClient({ product }: { product: any }) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const wishlisted = isInWishlist(product.id);

  const isColorWise =
    product.productType === "COLOR_WISE" ||
    (Array.isArray(product.variants) &&
      product.variants.some((v: Variant) => Boolean(v.colorName)));

  // Extract distinct colors with their hex codes
  const colorOptions = useMemo(() => {
    if (!isColorWise) return [];

    const map = new Map<string, string>();
    if (Array.isArray(product.variants)) {
      for (const v of product.variants as Variant[]) {
        if (v.colorName && !map.has(v.colorName)) {
          map.set(v.colorName, v.colorHex || "#7B1123");
        }
      }
    }

    if (map.size === 0 && Array.isArray(product.colors)) {
      for (const c of product.colors) {
        if (c && !map.has(c)) {
          map.set(c, "#7B1123");
        }
      }
    }

    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [isColorWise, product.variants, product.colors]);

  // Selected Color
  const [selectedColor, setSelectedColor] = useState<string>(
    colorOptions[0]?.name || (Array.isArray(product.colors) ? product.colors[0] : "") || ""
  );

  // Gallery images filtered by selected color if COLOR_WISE
  const currentImages = useMemo(() => {
    if (isColorWise && selectedColor && Array.isArray(product.images)) {
      const colorImgs = (product.images as ProductImage[])
        .filter(
          (img) =>
            img.colorName &&
            img.colorName.trim().toLowerCase() === selectedColor.trim().toLowerCase()
        )
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => img.url);

      if (colorImgs.length > 0) {
        return colorImgs;
      }
    }

    // Fallback: all images
    const list: string[] = [];
    if (product.mainImage) list.push(product.mainImage);
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img.url && !list.includes(img.url)) {
          list.push(img.url);
        }
      }
    }
    return list.length > 0 ? list : [product.mainImage || ""];
  }, [isColorWise, selectedColor, product.images, product.mainImage]);

  const [activeImage, setActiveImage] = useState<string>(currentImages[0] || "");

  // When selected color changes, update active image
  useEffect(() => {
    if (currentImages.length > 0) {
      setActiveImage(currentImages[0]);
    }
  }, [currentImages]);

  // Available sizes for the currently selected color (or all sizes for normal product)
  const availableSizes = useMemo(() => {
    if (isColorWise) {
      const variantsForColor = (product.variants as Variant[] | undefined)?.filter(
        (v) =>
          v.colorName &&
          v.colorName.trim().toLowerCase() === selectedColor.trim().toLowerCase()
      );
      if (variantsForColor && variantsForColor.length > 0) {
        return variantsForColor
          .map((v) => v.size)
          .filter((s) => typeof s === "string" && s.trim().length > 0);
      }
    } else if (Array.isArray(product.variants) && product.variants.length > 0) {
      return (product.variants as Variant[])
        .map((v) => v.size)
        .filter((s) => typeof s === "string" && s.trim().length > 0);
    }

    if (Array.isArray(product.sizes)) {
      return (product.sizes as string[]).filter(
        (s) => typeof s === "string" && s.trim().length > 0
      );
    }

    return [];
  }, [isColorWise, selectedColor, product.variants, product.sizes]);

  const validSpecifications = useMemo(() => {
    if (!Array.isArray(product.specifications)) return [];
    return product.specifications.filter(
      (s: any) =>
        s &&
        typeof s.key === "string" &&
        s.key.trim().length > 0 &&
        typeof s.value === "string" &&
        s.value.trim().length > 0
    );
  }, [product.specifications]);

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || "");

  // Keep selectedSize valid when color or sizes change
  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0]);
      }
    } else if (selectedSize !== "") {
      setSelectedSize("");
    }
  }, [availableSizes, selectedSize]);

  // Stock for current combination
  const currentVariant = useMemo(() => {
    if (!Array.isArray(product.variants) || product.variants.length === 0) return null;

    if (isColorWise) {
      return (product.variants as Variant[]).find(
        (v) =>
          v.colorName?.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
          (availableSizes.length > 0 ? v.size === selectedSize : true)
      );
    } else {
      if (availableSizes.length > 0) {
        return (product.variants as Variant[]).find((v) => v.size === selectedSize);
      }
      return (product.variants as Variant[])[0] || null;
    }
  }, [isColorWise, product.variants, selectedColor, selectedSize, availableSizes]);

  const currentStock = currentVariant ? currentVariant.stock : (product.stock ?? 0);

  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Helper to get stock of any size under current color
  const getSizeStock = (size: string) => {
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      return product.stock ?? 0;
    }
    if (isColorWise) {
      const v = (product.variants as Variant[]).find(
        (item) =>
          item.colorName?.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
          item.size === size
      );
      return v ? v.stock : 0;
    } else {
      const v = (product.variants as Variant[]).find((item) => item.size === size);
      return v ? v.stock : (product.stock ?? 0);
    }
  };

  const handleAddToCart = () => {
    if (currentStock <= 0) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      originalPrice: product.originalPrice,
      image: activeImage || product.mainImage,
      size: selectedSize ? selectedSize : undefined,
      color: isColorWise ? selectedColor : undefined,
      quantity,
      maxStock: currentStock,
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <div>
      {/* Breadcrumb (Hidden on Mobile) */}
      <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[#7A6F68] mb-6">
        <Link href="/" className="hover:text-[#7B1123]">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-[#7B1123]">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-[#7B1123]"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#2B1A13] font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* LEFT: Image Gallery (6 cols) */}
        <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {currentImages.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[560px] no-scrollbar">
              {currentImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImage === img
                      ? "border-[#7B1123] shadow-xs"
                      : "border-[#E8DFD5] opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${product.name} gallery image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image */}
          <div className="flex-1 rounded-2xl overflow-hidden bg-white border border-[#EFE8DE] shadow-xs relative aspect-3/4 max-h-[600px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-top transition-all duration-300"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.discount > 0 ? (
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#E51D39] text-white rounded-md shadow-xs">
                  {product.discount}% OFF
                </span>
              ) : product.isNewArrival ? (
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#C59A47] text-white rounded-md shadow-xs">
                  New Arrival
                </span>
              ) : null}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-xs transition-colors shadow-md cursor-pointer ${
                wishlisted
                  ? "bg-[#7B1123] text-white"
                  : "bg-white/90 text-[#2B1A13] hover:text-[#7B1123]"
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* RIGHT: Product Info & Order actions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-bold tracking-wider text-[#C59A47]">
                {product.category?.name}
              </span>
              {product.sku && (
                <>
                  <span className="text-[#D8CFBF]">•</span>
                  <span className="text-xs text-[#7A6F68]">
                    SKU: {currentVariant?.sku || product.sku}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13] tracking-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 p-4 bg-white rounded-xl border border-[#EFE8DE]">
            <span className="text-2xl sm:text-3xl font-bold text-[#7B1123]">
              {formatINR(product.sellingPrice)}
            </span>
            {product.originalPrice > product.sellingPrice && (
              <>
                <span className="text-sm sm:text-base text-[#7A6F68] line-through">
                  {formatINR(product.originalPrice)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Save {formatINR(product.originalPrice - product.sellingPrice)} ({product.discount}%)
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Color Selector (Shown strictly for COLOR_WISE products) */}
          {isColorWise && colorOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[#2B1A13]">
                  Select Color:{" "}
                  <span className="font-semibold text-[#7B1123]">{selectedColor}</span>
                </label>
                <span className="text-[11px] text-[#7A6F68]">
                  {colorOptions.length} available colors
                </span>
              </div>
              <div className="flex flex-wrap gap-4 pt-0.5">
                {colorOptions.map(({ name, hex }) => {
                  const isSelected = selectedColor === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedColor(name)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-hidden"
                    >
                      <span
                        className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                          isSelected
                            ? "ring-2 ring-[#7B1123] ring-offset-2 border-black/20 scale-105 shadow-xs"
                            : "border-black/15 group-hover:scale-105 group-hover:ring-1 group-hover:ring-[#7B1123]/40 group-hover:ring-offset-1"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                      {/* <span
                        className={`text-[10px] leading-tight text-center max-w-14 truncate transition-colors ${
                          isSelected
                            ? "font-bold text-[#7B1123]"
                            : "font-medium text-[#7A6F68] group-hover:text-[#2B1A13]"
                        }`}
                      >
                        {name}
                      </span> */}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {availableSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#2B1A13]">
                  Select Size:{" "}
                  <span className="font-semibold text-[#7B1123]">{selectedSize}</span>
                </label>
                {selectedSize && (
                  <span className="text-[11px] text-[#7A6F68]">
                    Stock: {currentStock > 0 ? `${currentStock} available` : "Out of stock"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size: string) => {
                  const isSelected = selectedSize === size;
                  const sizeStock = getSizeStock(size);
                  const isOutOfStock = sizeStock <= 0;

                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`relative min-w-12 h-11 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#7B1123] text-white border-[#7B1123] shadow-xs"
                          : isOutOfStock
                          ? "bg-gray-100 text-gray-400 border-gray-200 line-through cursor-pointer opacity-75"
                          : "bg-white text-[#2B1A13] border-[#E8DFD5] hover:border-[#7B1123]"
                      }`}
                    >
                      <span>{size}</span>
                      <span
                        className={`text-[9px] -mt-0.5 font-normal ${
                          isSelected ? "text-white/80" : "text-[#7A6F68]"
                        }`}
                      >
                        {sizeStock > 0 ? `${sizeStock} left` : "0"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart Action */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center border border-[#E8DFD5] rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-[#7A6F68] hover:text-[#2B1A13] rounded-lg cursor-pointer"
                  aria-label="Decrease quantity"
                  disabled={currentStock <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock || 1, q + 1))}
                  className="p-2 text-[#7A6F68] hover:text-[#2B1A13] rounded-lg cursor-pointer"
                  aria-label="Increase quantity"
                  disabled={currentStock <= 0 || quantity >= currentStock}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  currentStock <= 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : addedAnimation
                    ? "bg-emerald-700 text-white"
                    : "bg-[#7B1123] hover:bg-[#630c1b] text-white"
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{currentStock <= 0 ? "Out of Stock" : "Add to Bag"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Stock status indicator */}
            <p className="text-[11px] text-[#7A6F68]">
              {currentStock > 10 ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ In Stock ({currentStock} available), ready to dispatch
                </span>
              ) : currentStock > 0 ? (
                <span className="text-amber-700 font-semibold">
                Only {currentStock} item{currentStock > 1 ? "s" : ""} left in stock!
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  ✕ Currently sold out
                  {isColorWise
                    ? availableSizes.length > 0
                      ? " for this color & size"
                      : " for this color"
                    : availableSizes.length > 0
                    ? " for this size"
                    : ""}
                </span>
              )}
            </p>
          </div>

          {/* Delivery & Care Highlights */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-[#EFE8DE] text-center">
            <div className="flex flex-col items-center">
              <Truck className="w-4 h-4 text-[#7B1123] mb-1" />
              <span className="text-[10px] font-bold text-[#2B1A13]">Free Shipping</span>
              <span className="text-[9px] text-[#7A6F68]">Above ₹999</span>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw className="w-4 h-4 text-[#7B1123] mb-1" />
              <span className="text-[10px] font-bold text-[#2B1A13]">Easy Returns</span>
              <span className="text-[9px] text-[#7A6F68]">Within 7 Days</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-[#7B1123] mb-1" />
              <span className="text-[10px] font-bold text-[#2B1A13]">100% Authentic</span>
              <span className="text-[9px] text-[#7A6F68]">Verified Quality</span>
            </div>
          </div>

          {/* Full Description & Specifications */}
          <div className="pt-4 border-t border-[#EFE8DE] space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B1A13]">
                Product Description
              </h3>
              <p className="text-xs text-[#7A6F68] leading-relaxed whitespace-pre-line">
                {product.description?.trim()}
              </p>
            </div>

            {validSpecifications.length > 0 && (
              <div className="pt-3 border-t border-[#EFE8DE]/70 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B1A13]">
                  Product Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validSpecifications.map(
                    (spec: { key: string; value: string }, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-[#FAF7F2] text-xs"
                      >
                        <span className="text-[#7A6F68] font-medium">
                          {spec.key}
                        </span>
                        <span className="text-[#2B1A13] font-semibold text-right">
                          {spec.value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar: Fixed "Add to Bag" on Mobile View */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DFD5] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
            wishlisted
              ? "bg-[#7B1123]/10 border-[#7B1123] text-[#7B1123]"
              : "border-[#E8DFD5] text-[#7A6F68] hover:text-[#7B1123] bg-white"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-5 h-5 ${wishlisted ? "fill-[#7B1123]" : ""}`} />
        </button>

        {/* Price & Variant Quick Info */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[#7B1123]">
              {formatINR(product.sellingPrice)}
            </span>
            {product.originalPrice > product.sellingPrice && (
              <span className="text-[10px] text-[#7A6F68] line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          {selectedSize || (isColorWise && selectedColor) ? (
            <span className="text-[10px] text-[#7A6F68] truncate font-medium">
              {[
                isColorWise && selectedColor ? selectedColor : null,
                selectedSize ? `Size ${selectedSize}` : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-700 font-medium">
              {currentStock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          )}
        </div>

        {/* Add to Bag Action Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={currentStock <= 0}
          className={`flex-1 max-w-[200px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
            currentStock <= 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : addedAnimation
              ? "bg-emerald-700 text-white"
              : "bg-[#7B1123] hover:bg-[#630c1b] text-white"
          }`}
        >
          {addedAnimation ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>{currentStock <= 0 ? "Out of Stock" : "Add to Bag"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
