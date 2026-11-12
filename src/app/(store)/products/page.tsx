import React from "react";
import prisma from "@/lib/prisma";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/store/ProductCard";
import FilterSidebar from "@/components/store/FilterSidebar";
import MobileFilterDrawer from "@/components/store/MobileFilterDrawer";
import ShopBanner from "@/components/store/ShopBanner";
import SortDropdown from "@/components/store/SortDropdown";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    collection?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    color?: string;
    inStock?: string;
    discount?: string;
    search?: string;
    sort?: string;
    page?: string;
    offers?: string;
    new?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const category = params.category;
  const subcategory = params.subcategory;
  const collection = params.collection;
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined;
  const size = params.size;
  const inStock = params.inStock === "true";
  const discount = params.discount ? parseInt(params.discount, 10) : undefined;
  const search = params.search;
  const sort = params.sort || "newest";
  const isOffer = params.offers === "true";
  const isNew = params.new === "true";

  // Build Prisma Where Clause
  const where: any = { isActive: true };

  if (category) {
    where.category = { slug: category };
  }

  if (subcategory) {
    where.subcategory = { slug: subcategory };
  }

  if (collection) {
    where.collectionItems = {
      some: { collection: { slug: collection, isActive: true } },
    };
  }

  if (isOffer) {
    where.isOffer = true;
  }

  if (isNew) {
    where.isNewArrival = true;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.sellingPrice = {};
    if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
    if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
  }

  if (discount !== undefined) {
    where.discount = { gte: discount };
  }

  if (inStock) {
    where.stock = { gt: 0 };
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { sellingPrice: "asc" };
  if (sort === "price-desc") orderBy = { sellingPrice: "desc" };
  if (sort === "rating") orderBy = { rating: "desc" };

  const [categories, products, siteSettings] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { name: true, slug: true } },
        subcategory: { select: { name: true, slug: true } },
        variants: { select: { id: true, size: true, colorName: true, stock: true } },
      },
    }),
    prisma.siteSetting.findMany({
      where: {
        key: { in: ["announcement_bar", "footer_settings"] },
      },
    }),
  ]);

  // Client-side JSON array filtering for sizes
  let filteredProducts = products;
  if (size) {
    filteredProducts = filteredProducts.filter((p) => {
      const sizesArr = Array.isArray(p.sizes) ? (p.sizes as string[]) : [];
      return sizesArr.some((s) => s.toLowerCase() === size.toLowerCase());
    });
  }

  const settingsMap: Record<string, any> = {};
  for (const s of siteSettings) {
    settingsMap[s.key] = s.value;
  }

  // Active category title for breadcrumbs / heading
  const currentCat = categories.find((c) => c.slug === category);
  const currentSub = currentCat?.children?.find((s) => s.slug === subcategory);
  const pageTitle = currentSub
    ? `${currentCat?.name} — ${currentSub.name}`
    : currentCat
    ? currentCat.name
    : collection === "festive-edit"
    ? "The Festive Edit"
    : collection === "new-arrivals"
    ? "New Arrivals"
    : search
    ? `Search Results for "${search}"`
    : "All Fashion & Lifestyle";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar settings={settingsMap.announcement_bar} />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {/* Dynamic Shop Landscape Banner */}
        <ShopBanner
          category={currentCat}
          subcategory={currentSub}
          collectionTitle={
            collection === "festive-edit"
              ? "Festive Edit"
              : collection === "new-arrivals"
              ? "New Arrivals"
              : null
          }
          searchQuery={search}
        />

        {/* Desktop Breadcrumb + Product Count & Sort (Exact Same Line) */}
        <div className="hidden sm:flex items-center justify-between gap-4 pb-4 border-b border-[#EFE8DE] mb-6">
          <nav className="flex items-center gap-1.5 text-xs text-[#7A6F68]">
            <Link href="/" className="hover:text-[#7B1123]">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-[#7B1123]">Shop</Link>
            {currentCat && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/products?category=${currentCat.slug}`} className="hover:text-[#7B1123]">
                  {currentCat.name}
                </Link>
              </>
            )}
            {currentSub && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#2B1A13] font-semibold">{currentSub.name}</span>
              </>
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <span className="text-xs text-[#7A6F68]">
              Showing <strong>{filteredProducts.length}</strong> products
            </span>
            <SortDropdown currentSort={sort} />
          </div>
        </div>

        {/* Mobile Filter & Sort Bar (Filter Button & Sort By on the EXACT Same Line) */}
        <MobileFilterDrawer
          categories={categories}
          totalCount={filteredProducts.length}
          currentSort={sort}
        />

        {/* Two Column Layout: Left Filter Sidebar, Right Product Grid */}
        <div className="flex gap-8">
          {/* LEFT: Permanent Filter Sidebar on Desktop (stretches with grid so sticky aside works) */}
          <div className="hidden lg:block shrink-0">
            <FilterSidebar categories={categories} totalCount={filteredProducts.length} />
          </div>

          {/* RIGHT: Product Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EFE8DE] p-12 text-center my-6">
                <h3 className="font-serif text-lg font-bold text-[#2B1A13]">No Products Found</h3>
                <p className="text-xs text-[#7A6F68] mt-1 mb-6 max-w-sm mx-auto">
                  We couldn&apos;t find any products matching your selected filters. Try broadening your criteria or reset filters.
                </p>
                <Link
                  href="/products"
                  scroll={false}
                  className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors inline-block"
                >
                  Clear All Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer categories={categories} settings={settingsMap.footer_settings} />
    </div>
  );
}
