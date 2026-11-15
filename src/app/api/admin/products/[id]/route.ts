import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  findProductById,
  findFirstProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/repositories/product";
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
    const product = await findProductById(id, {
      includeCategory: true,
      includeSubcategory: true,
      includeImages: true,
      includeVariants: true,
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

    // Load existing product and its images before updating
    const existing = await findProductById(id, {
      includeImages: true,
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check slug collision
    const existingSlug = await findFirstProduct({
      slug: data.slug,
      NOT: { id },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Another product with this slug already exists" },
        { status: 409 }
      );
    }

    // Compute total stock
    let totalStock = data.stock;
    if (data.variants && data.variants.length > 0) {
      totalStock = data.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    }

    // Update product & variants atomically
    const updated = await updateProduct(id, {
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

    // After the update succeeds, call deleteFromCloudinary for every publicId that was removed or replaced
    const remainingPublicIds = new Set<string>();
    if (data.mainImageId) {
      remainingPublicIds.add(data.mainImageId);
    }
    if (Array.isArray(data.galleryImages)) {
      for (const img of data.galleryImages) {
        if (img.publicId) {
          remainingPublicIds.add(img.publicId);
        }
      }
    }

    const removedPublicIds = new Set<string>();
    if (existing.mainImageId && !remainingPublicIds.has(existing.mainImageId)) {
      removedPublicIds.add(existing.mainImageId);
    }
    if (Array.isArray(existing.images)) {
      for (const img of existing.images) {
        if (img.publicId && !remainingPublicIds.has(img.publicId)) {
          removedPublicIds.add(img.publicId);
        }
      }
    }

    for (const pid of removedPublicIds) {
      deleteFromCloudinary(pid).catch((err) => {
        console.error(`Failed to delete Cloudinary asset ${pid}:`, err);
      });
    }

    revalidatePath("/");
    revalidatePath("/products");

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
    const product = await findProductById(id, {
      includeImages: true,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Try deleting Cloudinary images in background
    if (product.mainImageId) {
      deleteFromCloudinary(product.mainImageId).catch(console.error);
    }
    if (product.images) {
      for (const img of product.images) {
        if (img.publicId) {
          deleteFromCloudinary(img.publicId).catch(console.error);
        }
      }
    }

    await deleteProduct(id);

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
