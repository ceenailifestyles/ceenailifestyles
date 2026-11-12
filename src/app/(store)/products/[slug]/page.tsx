import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailsClient from "./ProductDetailsClient";
import ProductCard from "@/components/store/ProductCard";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      subcategory: true,
      images: { orderBy: { displayOrder: "asc" } },
      variants: true,
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Fetch related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      NOT: { id: product.id },
    },
    take: 5,
    include: {
      category: { select: { name: true, slug: true } },
      variants: { select: { id: true, size: true, colorName: true, stock: true } },
    },
  });

  // Fetch site settings and categories for header
  const [categories, siteSettings] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        children: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
      },
    }),
    prisma.siteSetting.findMany({
      where: { key: { in: ["announcement_bar", "footer_settings"] } },
    }),
  ]);

  const settingsMap: Record<string, any> = {};
  for (const s of siteSettings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar settings={settingsMap.announcement_bar} />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20 sm:pb-12 flex-1 w-full">
        {/* Client interactive product details */}
        <ProductDetailsClient product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-6 sm:mt-12 pt-6 sm:pt-8 border-t border-[#EFE8DE] pb-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B1A13] tracking-tight mb-4 sm:mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel as any} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer settings={settingsMap.footer_settings} />
    </div>
  );
}
