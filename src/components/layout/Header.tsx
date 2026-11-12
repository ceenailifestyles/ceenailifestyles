"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import { useStore } from "@/context/StoreContext";
import {
  Search,
  User,
  ShoppingBag,
  Heart,
  Menu,
  ChevronDown,
  X,
} from "lucide-react";

interface SubCategoryItem {
  id?: string;
  name: string;
  slug: string;
}

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  children?: SubCategoryItem[];
}

let cachedHeaderCategories: CategoryItem[] | null = null;

export default function Header({
  categories,
}: {
  categories?: CategoryItem[];
}) {
  const router = useRouter();
  const { user, openAuthModal, cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen } = useStore();

  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(
    categories && categories.length > 0 ? categories : cachedHeaderCategories || []
  );
  const hasFetchedCategoriesRef = useRef(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCollectionOpen, setIsMobileCollectionOpen] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openMegaMenu = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsMegaMenuOpen(true);
  };

  const closeMegaMenuWithDelay = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 200);
  };

  // Strictly sync categories from MySQL data (cached across navigations)
  useEffect(() => {
    if (categories && categories.length > 0) {
      cachedHeaderCategories = categories;
      setCategoriesList(categories);
      return;
    }

    if (cachedHeaderCategories && cachedHeaderCategories.length > 0) {
      setCategoriesList(cachedHeaderCategories);
      return;
    }

    // If already requested or in progress, do not fetch again
    if (hasFetchedCategoriesRef.current || (typeof window !== "undefined" && (window as any).__ceenai_categories_fetching)) {
      return;
    }
    hasFetchedCategoriesRef.current = true;
    if (typeof window !== "undefined") {
      (window as any).__ceenai_categories_fetching = true;
    }

    fetch("/api/store/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && Array.isArray(data.categories)) {
          cachedHeaderCategories = data.categories;
          setCategoriesList(data.categories);
        }
      })
      .catch((err) => console.error("Error loading categories from MySQL:", err))
      .finally(() => {
        if (typeof window !== "undefined") {
          (window as any).__ceenai_categories_fetching = false;
        }
      });
  }, [categories]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EFE8DE] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18 md:h-20 flex-nowrap gap-4">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#2B1A13] hover:text-[#7B1123] rounded-lg transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Logo (Emblem on top, brand name on bottom) */}
          <div className="flex items-center shrink-0">
            <Logo size="md" />
          </div>

          {/* Desktop Navigation: Collections, New Arrivals, Festive Edit, Offers */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 self-stretch text-[13px] font-medium text-[#2B1A13]">
            {/* 1. Collections Dropdown Trigger */}
            <div
              className="relative self-stretch flex items-center cursor-pointer"
              onMouseEnter={openMegaMenu}
              onMouseLeave={closeMegaMenuWithDelay}
            >
              <button
                type="button"
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-1.5 hover:text-[#7B1123] transition-colors py-2 font-medium tracking-wide select-none cursor-pointer"
              >
                <span>Collections</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#2B1A13]/80 transition-transform duration-200 ${
                    isMegaMenuOpen ? "rotate-180 text-[#7B1123]" : ""
                  }`}
                />
              </button>
            </div>

            {/* 2. New Arrivals */}
            <Link
              href="/products?collection=new-arrivals"
              className="hover:text-[#7B1123] transition-colors py-2 whitespace-nowrap tracking-wide"
            >
              New Arrivals
            </Link>

            {/* 3. Festive Edit */}
            <Link
              href="/products?collection=festive-edit"
              className="hover:text-[#7B1123] transition-colors py-2 whitespace-nowrap tracking-wide"
            >
              Festive Edit
            </Link>

            {/* 4. Offers Pill */}
            <Link
              href="/products?offers=true"
              className="py-1 px-3.5 bg-[#FAD7A0]/70 hover:bg-[#FAD7A0] text-[#7B1123] rounded-full text-xs font-semibold whitespace-nowrap transition-colors shadow-2xs"
            >
              Offers
            </Link>
          </nav>

          {/* Right Action Icons: Search, User, Heart, Cart */}
          <div className="flex items-center gap-1 sm:gap-2 xl:gap-3 shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[#2B1A13] hover:text-[#7B1123] rounded-full hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account Icon (Hidden on mobile view, shown on desktop) */}
            {user ? (
              <Link
                href="/profile"
                className="hidden lg:flex p-2 text-[#2B1A13] hover:text-[#7B1123] rounded-full hover:bg-[#FAF7F2] transition-colors items-center gap-1"
                title={`Signed in as ${user.name}`}
              >
                <User className="w-5 h-5 text-[#7B1123]" />
                <span className="hidden 2xl:inline text-xs font-medium max-w-[70px] truncate">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="hidden lg:flex p-2 text-[#2B1A13] hover:text-[#7B1123] rounded-full hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                aria-label="Account Login"
                title="Sign in / Register"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 text-[#2B1A13] hover:text-[#7B1123] rounded-full hover:bg-[#FAF7F2] transition-colors relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#7B1123] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-[#2B1A13] hover:text-[#7B1123] rounded-full hover:bg-[#FAF7F2] transition-colors relative cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#2B1A13] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar Drawer/Dropdown with Slow, Smooth Opening/Closing Animation */}
        <div
          className={`grid transition-all duration-500 ease-in-out ${
            isSearchOpen
              ? "grid-rows-[1fr] opacity-100 border-t border-[#EFE8DE]"
              : "grid-rows-[0fr] opacity-0 pointer-events-none border-t border-transparent"
          }`}
        >
          <div className="overflow-hidden">
            <div className="py-3 pb-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products, kurtis, sets, dresses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF7F2] rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-hidden focus:border-[#7B1123] transition-colors"
                  />
                  <Search className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="bg-[#7B1123] hover:bg-[#630c1b] text-white px-5 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-[#7A6F68] hover:text-[#2B1A13] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 7-COLUMN MEGA MENU (All data from MySQL categories table) */}
      {isMegaMenuOpen && (
        <div
          className="absolute top-full left-0 right-0 w-full bg-white border-t border-[#EFE8DE] border-b border-[#EFE8DE] shadow-2xl z-50 animate-mega-menu"
          onMouseEnter={openMegaMenu}
          onMouseLeave={closeMegaMenuWithDelay}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {categoriesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#7A6F68]">
                Loading categories...
              </div>
            ) : (
              <div
                className="grid gap-5 xl:gap-7"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(categoriesList.length, 7)}, minmax(0, 1fr))`,
                }}
              >
                {categoriesList.slice(0, 7).map((cat) => {
                  const displayName =
                    cat.name === "Fashion Accessories" ? "Accessories" : cat.name;
                  const subs = cat.children || [];

                  return (
                    <div key={cat.slug} className="space-y-3">
                      {/* Category Heading from MySQL */}
                      <Link
                        href={`/products?category=${cat.slug}`}
                        prefetch={false}
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="block font-serif font-bold text-sm text-[#2B1A13] hover:text-[#7B1123] pb-2 border-b border-[#EFE8DE] transition-colors tracking-wide"
                      >
                        {displayName}
                      </Link>

                      {/* Subcategories underneath from MySQL */}
                      <div className="space-y-1.5 pt-1">
                        {subs.length > 0 ? (
                          subs.map((sub) => (
                            <Link
                              key={sub.slug}
                              href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                              prefetch={false}
                              onClick={() => setIsMegaMenuOpen(false)}
                              className="block text-xs text-[#5C4D44] hover:text-[#7B1123] hover:translate-x-0.5 transition-all py-0.5 leading-snug"
                            >
                              {sub.name}
                            </Link>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#7A6F68]/60 italic">
                            All items
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer: Rendered via Portal directly into document.body with z-[9999] so it is NEVER trapped under the hero section */}
      {mounted &&
        isMobileMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 lg:hidden backdrop-blur-xs flex animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-4/5 max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Top Bar */}
              <div className="p-4 px-6 border-b border-[#EFE8DE] flex items-center justify-between bg-[#FAF7F2]">
                <Logo size="sm" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-[#7A6F68] hover:text-[#2B1A13] rounded-full cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Collections Accordion */}
                <div className="border-b border-[#FAF7F2] pb-1">
                  <button
                    type="button"
                    onClick={() => setIsMobileCollectionOpen(!isMobileCollectionOpen)}
                    className="w-full flex items-center justify-between py-2.5 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123] rounded-lg cursor-pointer"
                  >
                    <span>Collections</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#7A6F68] transition-transform duration-200 ${
                        isMobileCollectionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isMobileCollectionOpen && (
                    <div className="pl-3 space-y-1 py-1">
                      {categoriesList.slice(0, 7).map((cat) => {
                        const displayName =
                          cat.name === "Fashion Accessories" ? "Accessories" : cat.name;
                        const subs = cat.children || [];
                        const isCatOpen = openMobileCategory === cat.slug;

                        return (
                          <div key={cat.slug} className="space-y-1">
                            {subs.length > 0 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMobileCategory(isCatOpen ? null : cat.slug)
                                  }
                                  className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123] rounded-lg cursor-pointer"
                                >
                                  <span>{displayName}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-[#7A6F68] transition-transform duration-200 ${
                                      isCatOpen ? "rotate-180 text-[#7B1123]" : ""
                                    }`}
                                  />
                                </button>
                                {isCatOpen && (
                                  <div className="pl-4 space-y-1 border-l border-[#EFE8DE] ml-3">
                                    {subs.map((sub) => (
                                      <Link
                                        key={sub.slug}
                                        href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block py-2 px-2 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123]"
                                      >
                                        {sub.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <Link
                                href={`/products?category=${cat.slug}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-2 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123] rounded-lg"
                              >
                                {displayName}
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Standard Links */}
                <div className="pt-2 space-y-1">
                  <Link
                    href="/products?collection=new-arrivals"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2.5 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123]"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    href="/products?collection=festive-edit"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2.5 px-3 text-xs font-semibold text-[#7B1123]"
                  >
                    Festive Edit
                  </Link>
                  <Link
                    href="/products?offers=true"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2.5 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123]"
                  >
                    Offers
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsWishlistOpen(true);
                    }}
                    className="w-full text-left block py-2.5 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123] cursor-pointer"
                  >
                    My Wishlist ({wishlistCount})
                  </button>
                  {user ? (
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2.5 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123]"
                    >
                      My Account ({user.name.split(" ")[0]})
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal("login");
                      }}
                      className="w-full text-left block py-2.5 px-3 text-xs font-semibold text-[#2B1A13] hover:text-[#7B1123] cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Quick Link */}
              <div className="p-4 border-t border-[#EFE8DE] bg-[#FAF7F2]">
                <Link
                  href="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-[#7B1123] text-white rounded-lg text-xs font-semibold hover:bg-[#630c1b] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Explore All Products</span>
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
