import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      banners,
      categories,
      featuredProducts,
      bestSellers,
      offers,
      newArrivals,
      festiveCollection,
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
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 2, orderBy: { displayOrder: "asc" } },
        },
      }),
      prisma.product.findMany({
        where: { isBestSeller: true, isActive: true },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 2, orderBy: { displayOrder: "asc" } },
        },
      }),
      prisma.product.findMany({
        where: { isOffer: true, isActive: true },
        take: 10,
        orderBy: { discount: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 2, orderBy: { displayOrder: "asc" } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 2, orderBy: { displayOrder: "asc" } },
        },
      }),
      prisma.collection.findFirst({
        where: { slug: "festive-edit", isActive: true },
        include: {
          products: {
            take: 6,
            include: { product: true },
          },
        },
      }),
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: ["benefits", "about_ceenai", "testimonials", "announcement_bar", "footer_settings"],
          },
        },
      }),
    ]);

    const settingsMap: Record<string, any> = {};
    for (const item of siteSettings) {
      settingsMap[item.key] = item.value;
    }

    return NextResponse.json({
      banners,
      categories,
      featuredProducts: {
        featured: featuredProducts,
        bestSellers,
        offers,
      },
      newArrivals,
      festiveCollection,
      benefits: settingsMap.benefits || [],
      aboutCeenai: settingsMap.about_ceenai || null,
      testimonials: settingsMap.testimonials || [],
      announcementBar: settingsMap.announcement_bar || null,
      footerSettings: settingsMap.footer_settings || null,
    });
  } catch (error) {
    console.error("Store home API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

