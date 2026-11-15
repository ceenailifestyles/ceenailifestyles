import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findCategoryById, findFirstCategory, updateCategory, deleteCategory } from "@/lib/repositories/category";
import { countProducts } from "@/lib/repositories/product";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

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
    const { name, parentId, description, image, publicId, displayOrder, isActive } = body;

    if (!name || !parentId) {
      return NextResponse.json(
        { error: "Subcategory name and parent category are required" },
        { status: 400 }
      );
    }

    const existingSub = await findCategoryById(id);
    if (!existingSub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    let slug = body.slug ? slugify(body.slug) : slugify(name);
    // Check slug collision with other records
    const existing = await findFirstCategory({
      slug,
      NOT: { id },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const subcategory = await updateCategory(id, {
      name: name.trim(),
      slug,
      parentId,
      description: description !== undefined ? (description?.trim() || null) : undefined,
      image: image !== undefined ? (image || null) : undefined,
      publicId: publicId !== undefined ? (publicId || null) : undefined,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      isActive: isActive !== false,
    });

    if (existingSub.publicId && publicId !== undefined && existingSub.publicId !== (publicId || null)) {
      deleteFromCloudinary(existingSub.publicId).catch((err) => {
        console.error("Failed to delete replaced subcategory asset:", err);
      });
    }

    const parent = await findCategoryById(parentId);
    subcategory.parent = parent ? { id: parent.id, name: parent.name, slug: parent.slug } as any : null;
    const prodCount = await countProducts({ subcategoryId: id });
    subcategory._count = { subProducts: prodCount };

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error("Admin subcategory PUT error:", error);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
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
    const subcat = await findCategoryById(id);
    if (!subcat) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // Check if subcategory has products
    const productCount = await countProducts({
      subcategoryId: id,
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subcategory because it is assigned to ${productCount} product(s). Please reassign or delete the products first.`,
        },
        { status: 409 }
      );
    }

    await deleteCategory(id);

    if (subcat.publicId) {
      deleteFromCloudinary(subcat.publicId).catch((err) => {
        console.error("Failed to delete subcategory asset on delete:", err);
      });
    }

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin subcategory DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}

