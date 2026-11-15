import { NextResponse } from "next/server";
import { findProducts, countProducts } from "@/lib/repositories/product";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const collection = searchParams.get("collection");
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const inStock = searchParams.get("inStock") === "true";
    const discount = searchParams.get("discount") ? parseInt(searchParams.get("discount")!, 10) : undefined;
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest"; // newest, price-asc, price-desc, rating
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(searchParams.get("limit") || "16", 10);
    const limit = isNaN(rawLimit) ? 16 : Math.min(48, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    const idsParam = searchParams.get("ids");
    let wishlistIds: string[] | null = null;
    if (idsParam !== null) {
      wishlistIds = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 50);

      if (wishlistIds.length === 0) {
        return NextResponse.json({
          products: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          },
        });
      }

      where.id = { in: wishlistIds };
    }

    if (category) {
      where.categorySlug = category;
    }

    if (subcategory) {
      where.subcategorySlug = subcategory;
    }

    if (collection) {
      where.collectionSlug = collection;
    }

    if (minPrice !== undefined) {
      where.minPrice = minPrice;
    }

    if (maxPrice !== undefined) {
      where.maxPrice = maxPrice;
    }

    if (discount !== undefined) {
      where.minDiscount = discount;
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    if (search) {
      where.search = search;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { sellingPrice: "asc" };
    if (sort === "price-desc") orderBy = { sellingPrice: "desc" };
    if (sort === "rating") orderBy = { rating: "desc" };

    const take = wishlistIds ? wishlistIds.length : limit;
    const effectiveSkip = wishlistIds ? 0 : skip;

    const [products, totalCount] = await Promise.all([
      findProducts({
        where,
        orderBy,
        skip: effectiveSkip,
        take,
        includeCategory: true,
        includeSubcategory: true,
        includeImages: true,
        includeVariants: true,
      }),
      countProducts(where),
    ]);

    // Client-side array filtering for JSON fields (sizes, colors) if passed
    let filteredProducts = products;
    if (size) {
      filteredProducts = filteredProducts.filter((p) => {
        const sizesArr = Array.isArray(p.sizes) ? (p.sizes as string[]) : [];
        return sizesArr.some((s) => s.toLowerCase() === size.toLowerCase());
      });
    }

    if (color) {
      filteredProducts = filteredProducts.filter((p) => {
        const colorsArr = Array.isArray(p.colors) ? (p.colors as string[]) : [];
        return colorsArr.some((c) => c.toLowerCase().includes(color.toLowerCase()));
      });
    }

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        total: totalCount,
        page: wishlistIds ? 1 : page,
        limit: wishlistIds ? take : limit,
        totalPages: wishlistIds ? 1 : Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Store products API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

