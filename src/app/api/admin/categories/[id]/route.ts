import { NextResponse } from "next/server";
import { findCategoryById, findFirstCategory, updateCategory, deleteCategory } from "@/lib/repositories/category";
import { getAdminSession } from "@/lib/auth";
import { categorySchema, getZodErrorMessage } from "@/lib/validations";
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
    const validated = categorySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await findFirstCategory({
      slug: data.slug,
      NOT: { id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Another category with this slug exists" },
        { status: 409 }
      );
    }

    const updated = await updateCategory(id, {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image: data.image || null,
      publicId: data.publicId || null,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      parentId: data.parentId || null,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("Admin category PUT error:", error);
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
    const cat = await findCategoryById(id, { includeCounts: true });

    if (!cat) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const productCount = cat._count?.products || 0;
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: it has ${productCount} products assigned to it.` },
        { status: 400 }
      );
    }

    if (cat.publicId) {
      await deleteFromCloudinary(cat.publicId);
    }

    await deleteCategory(id);

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Admin category DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
