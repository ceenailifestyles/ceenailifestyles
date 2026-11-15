import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findProducts, findProductBySlug, createProduct } from "@/lib/repositories/product";
import { getAdminSession } from "@/lib/auth";
import { productSchema, getZodErrorMessage } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const where: any = {};
    if (search) {
      where.search = search;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await findProducts({
      where,
      orderBy: { createdAt: "desc" },
      includeCategory: true,
      includeSubcategory: true,
      includeImages: true,
      includeVariants: true,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = productSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await findProductBySlug(data.slug);

    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    // Calculate total stock from variants if provided
    let totalStock = data.stock;
    if (data.variants && data.variants.length > 0) {
      totalStock = data.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    }

    const result = await createProduct({
      name: data.name,
      slug: data.slug,
      sku: data.sku || null,
      description: data.description,
      shortDescription: data.shortDescription || null,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      productType: data.productType,
      sellingPrice: data.sellingPrice,
      originalPrice: data.originalPrice,
      discount: data.discount,
      mainImage: data.mainImage,
      mainImageId: data.mainImageId || null,
      sizes: data.sizes,
      colors: data.colors,
      specifications: data.specifications,
      stock: totalStock,
      isFeatured: data.isFeatured,
      isBestSeller: data.isBestSeller,
      isNewArrival: data.isNewArrival,
      isOffer: data.isOffer,
      isActive: data.isActive,
      images: data.galleryImages,
      variants: data.variants,
    });

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true, product: result }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
