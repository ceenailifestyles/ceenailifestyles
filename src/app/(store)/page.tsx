import React from "react";
import prisma from "@/lib/prisma";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import HeroBanner from "@/components/store/HeroBanner";
import BenefitsBar from "@/components/store/BenefitsBar";
import ShopByCategory from "@/components/store/ShopByCategory";
import FeaturedProducts from "@/components/store/FeaturedProducts";
import PromoBanners from "@/components/store/PromoBanners";
import AllProducts from "@/components/store/AllProducts";
import Newsletter from "@/components/store/Newsletter";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch all real MySQL data concurrently
  const [
    banners,
    categories,
    featuredProducts,
    bestSellers,
    offers,
    allProducts,
    collections,
    siteSettings,
  ] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
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
      where: { isFeatured: true, isActive: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, size: true, colorName: true, stock: true } },
      },
    }),
    prisma.product.findMany({
      where: { isBestSeller: true, isActive: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, size: true, colorName: true, stock: true } },
      },
    }),
    prisma.product.findMany({
      where: { isOffer: true, isActive: true },
      take: 10,
      orderBy: { discount: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, size: true, colorName: true, stock: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, size: true, colorName: true, stock: true } },
      },
    }),
    prisma.collection.findMany({
      where: { isActive: true },
      take: 2,
      orderBy: { displayOrder: "asc" },
    }),
    prisma.siteSetting.findMany({
      where: {
        key: {
          in: ["benefits", "announcement_bar", "footer_settings"],
        },
      },
    }),
  ]);

  const settingsMap: Record<string, any> = {};
  for (const s of siteSettings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Announcement Bar */}
      <AnnouncementBar settings={settingsMap.announcement_bar} />

      {/* Main Header with MySQL-driven Categories */}
      <Header categories={categories} />

      {/* Main Content */}
      <main className="flex-1">
        {/* A. Hero Banner from MySQL */}
        <HeroBanner banners={banners} />

        {/* B. Shopping Benefits from MySQL */}
        <BenefitsBar benefits={settingsMap.benefits} />

        {/* C. Shop by Category from MySQL */}
        <ShopByCategory categories={categories} />

        {/* D. Featured Products from MySQL */}
        <FeaturedProducts
          initialTabs={{
            featured: featuredProducts as any,
            bestSellers: bestSellers as any,
            offers: offers as any,
          }}
        />

        {/* E & F. Promo Banners from MySQL */}
        <PromoBanners collections={collections} />

        {/* G. All Products Section from MySQL */}
        <AllProducts products={allProducts as any} />

        {/* H. Newsletter */}
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer categories={categories} settings={settingsMap.footer_settings} />
    </div>
  );
}
