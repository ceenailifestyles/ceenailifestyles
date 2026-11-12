import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        images: { orderBy: { displayOrder: "asc" } },
        variants: true,
      },
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
    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    // Run creation inside a transaction for complete database consistency
    const result = await prisma.$transaction(async (tx) => {
      // Calculate total stock from variants if provided
      let totalStock = data.stock;
      if (data.variants && data.variants.length > 0) {
        totalStock = data.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      }

      const product = await tx.product.create({
        data: {
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
        },
      });

      // Create gallery images with color association
      if (data.galleryImages && data.galleryImages.length > 0) {
        await tx.productImage.createMany({
          data: data.galleryImages.map((img, idx) => ({
            productId: product.id,
            url: img.url,
            publicId: img.publicId || null,
            colorName: img.colorName || null,
            displayOrder: idx,
          })),
        });
      }

      // Create variants
      if (data.variants && data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: product.id,
            colorName: v.colorName || null,
            colorHex: v.colorHex || null,
            size: v.size,
            stock: v.stock || 0,
            sku: v.sku || null,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          subcategory: true,
          images: { orderBy: { displayOrder: "asc" } },
          variants: true,
        },
      });
    });

    return NextResponse.json({ success: true, product: result }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
