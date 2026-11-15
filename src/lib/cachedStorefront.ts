import { unstable_cache } from "next/cache";
import { findBanners } from "@/lib/repositories/banner";
import { findCategories } from "@/lib/repositories/category";
import { findProducts } from "@/lib/repositories/product";
import { findCollections } from "@/lib/repositories/collection";
import { findSiteSettings } from "@/lib/repositories/siteSetting";

/**
 * Cached storefront queries.
 * Wrapped in unstable_cache for runtime caching with 120s revalidation and on-demand cache tags.
 * Return values are JSON-serialized so Date objects become strings cleanly without serialization warnings.
 */

export const getCachedBanners = unstable_cache(
  async () => {
    const banners = await findBanners({ isActive: true }, { displayOrder: "asc" });
    return JSON.parse(JSON.stringify(banners));
  },
  ["storefront_banners"],
  { revalidate: 120, tags: ["banners", "storefront"] }
);

export const getCachedCategories = unstable_cache(
  async () => {
    const categories = await findCategories({
      where: { parentId: null, isActive: true },
      orderBy: { displayOrder: "asc" },
      includeChildren: true,
    });
    return JSON.parse(JSON.stringify(categories));
  },
  ["storefront_categories"],
  { revalidate: 120, tags: ["categories", "storefront"] }
);

export const getCachedFeaturedProducts = unstable_cache(
  async () => {
    const products = await findProducts({
      where: { isFeatured: true, isActive: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      includeCategory: true,
      includeVariants: true,
    });
    return JSON.parse(JSON.stringify(products));
  },
  ["storefront_featured_products"],
  { revalidate: 120, tags: ["products", "storefront"] }
);

export const getCachedBestSellerProducts = unstable_cache(
  async () => {
    const products = await findProducts({
      where: { isBestSeller: true, isActive: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      includeCategory: true,
      includeVariants: true,
    });
    return JSON.parse(JSON.stringify(products));
  },
  ["storefront_bestseller_products"],
  { revalidate: 120, tags: ["products", "storefront"] }
);

export const getCachedOfferProducts = unstable_cache(
  async () => {
    const products = await findProducts({
      where: { isOffer: true, isActive: true },
      take: 10,
      orderBy: { discount: "desc" },
      includeCategory: true,
      includeVariants: true,
    });
    return JSON.parse(JSON.stringify(products));
  },
  ["storefront_offer_products"],
  { revalidate: 120, tags: ["products", "storefront"] }
);

export const getCachedAllProducts = unstable_cache(
  async () => {
    const products = await findProducts({
      where: { isActive: true },
      take: 50,
      orderBy: { createdAt: "desc" },
      includeCategory: true,
      includeVariants: true,
    });
    return JSON.parse(JSON.stringify(products));
  },
  ["storefront_all_products"],
  { revalidate: 120, tags: ["products", "storefront"] }
);

export const getCachedCollections = unstable_cache(
  async () => {
    const collections = await findCollections({
      where: { isActive: true },
      take: 2,
      orderBy: { displayOrder: "asc" },
    });
    return JSON.parse(JSON.stringify(collections));
  },
  ["storefront_collections"],
  { revalidate: 120, tags: ["collections", "storefront"] }
);

export const getCachedSiteSettings = unstable_cache(
  async (keys: string[]) => {
    const settings = await findSiteSettings({
      key: { in: keys },
    });
    return JSON.parse(JSON.stringify(settings));
  },
  ["storefront_settings"],
  { revalidate: 120, tags: ["settings", "storefront"] }
);

