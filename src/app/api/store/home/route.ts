import { NextResponse } from "next/server";
import { findBanners } from "@/lib/repositories/banner";
import { findCategories } from "@/lib/repositories/category";
import { findProducts } from "@/lib/repositories/product";
import { findFirstCollection } from "@/lib/repositories/collection";
import { findSiteSettings } from "@/lib/repositories/siteSetting";

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
      findBanners({ isActive: true }, { displayOrder: "asc" }),
      findCategories({
        where: { parentId: null, isActive: true },
        orderBy: { displayOrder: "asc" },
        includeChildren: true,
      }),
      findProducts({
        where: { isFeatured: true, isActive: true },
        take: 10,
        orderBy: { createdAt: "desc" },
        includeCategory: true,
        includeImages: true,
      }),
      findProducts({
        where: { isBestSeller: true, isActive: true },
        take: 10,
        orderBy: { createdAt: "desc" },
        includeCategory: true,
        includeImages: true,
      }),
      findProducts({
        where: { isOffer: true, isActive: true },
        take: 10,
        orderBy: { discount: "desc" },
        includeCategory: true,
        includeImages: true,
      }),
      findProducts({
        where: { isActive: true },
        take: 8,
        orderBy: { createdAt: "desc" },
        includeCategory: true,
        includeImages: true,
      }),
      findFirstCollection({
        where: { slug: "festive-edit", isActive: true },
        includeProducts: true,
      }),
      findSiteSettings({
        key: {
          in: ["benefits", "about_ceenai", "testimonials", "announcement_bar", "footer_settings"],
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

