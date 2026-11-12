"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/store/ProductCard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { Heart, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistProducts() {
      try {
        const res = await fetch("/api/store/products?limit=100");
        const data = await res.json();
        if (data.products) {
          const wishlistedOnes = data.products.filter((p: any) =>
            wishlist.includes(p.id)
          );
          setProducts(wishlistedOnes);
        }
      } catch (e) {
        console.error("Wishlist load error", e);
      } finally {
        setLoading(false);
      }
    }

    loadWishlistProducts();
  }, [wishlist]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs border border-[#EFE8DE]">
            <Heart className="w-6 h-6 text-[#7B1123]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13]">
            My Wishlist
          </h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[#7A6F68]">Loading your wishlist...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EFE8DE] p-12 text-center max-w-md mx-auto my-6 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Your wishlist is empty</h3>
            <p className="text-xs text-[#7A6F68] mt-1 mb-6">
              Explore our ethnic collections, western wear, and jewellery to save items you love.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

