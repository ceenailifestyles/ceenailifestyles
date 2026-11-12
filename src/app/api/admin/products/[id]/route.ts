import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { productSchema, getZodErrorMessage } from "@/lib/validations";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        images: { orderBy: { displayOrder: "asc" } },
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin product GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = productSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check slug collision
    const existingSlug = await prisma.product.findFirst({
      where: {
        slug: data.slug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Another product with this slug already exists" },
        { status: 409 }
      );
    }

    // Update product & variants atomically
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Re-create gallery images if provided
      if (data.galleryImages !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (data.galleryImages.length > 0) {
          await tx.productImage.createMany({
            data: data.galleryImages.map((img, idx) => ({
              productId: id,
              url: img.url,
              publicId: img.publicId || null,
              colorName: img.colorName || null,
              displayOrder: idx,
            })),
          });
        }
      }

      // 2. Re-create variants if provided
      if (data.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (data.variants.length > 0) {
          await tx.productVariant.createMany({
            data: data.variants.map((v) => ({
              productId: id,
              colorName: v.colorName || null,
              colorHex: v.colorHex || null,
              size: v.size,
              stock: v.stock || 0,
              sku: v.sku || null,
            })),
          });
        }
      }

      // 3. Compute total stock
      let totalStock = data.stock;
      if (data.variants && data.variants.length > 0) {
        totalStock = data.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      }

      return tx.product.update({
        where: { id },
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
        include: {
          category: true,
          subcategory: true,
          images: { orderBy: { displayOrder: "asc" } },
          variants: true,
        },
      });
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Admin product PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Try deleting Cloudinary images in background
    if (product.mainImageId) {
      deleteFromCloudinary(product.mainImageId).catch(console.error);
    }
    for (const img of product.images) {
      if (img.publicId) {
        deleteFromCloudinary(img.publicId).catch(console.error);
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
