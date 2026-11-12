"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard, { ProductCardData } from "./ProductCard";

interface AllProductsProps {
  products: ProductCardData[];
}

export default function AllProducts({ products = [] }: AllProductsProps) {
  const [shuffledProducts, setShuffledProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const array = [...products];
    // Fisher-Yates shuffle to randomize products every time
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setShuffledProducts(array.slice(0, 10));
  }, [products]);

  if (!products || products.length === 0) return null;

  // Display randomized products each time
  const displayProducts =
    shuffledProducts.length > 0 ? shuffledProducts : products.slice(0, 10);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-16">
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13] tracking-tight">
          All Products
        </h2>
      </div>

      {/* 10 Products Grid: 2 cols on mobile, 3 on tablet, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      <div className="mt-10 sm:mt-12 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#7B1123] text-white hover:bg-[#630c1b] transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer group"
        >
          <span>View All Products</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

