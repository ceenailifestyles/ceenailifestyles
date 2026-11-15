import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { findCategories, findCategoryById, findCategoryBySlug, createCategory } from "@/lib/repositories/category";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");

    const subcategories = await findCategories({
      where: parentId ? { parentId } : { isSubcategory: true },
      orderBy: [{ parentId: "asc" }, { displayOrder: "asc" }],
      includeParent: true,
      includeCounts: true,
    });

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error("Admin subcategories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, parentId, description, image, publicId, displayOrder, isActive } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Subcategory name is required" }, { status: 400 });
    }

    if (!parentId || typeof parentId !== "string") {
      return NextResponse.json({ error: "Parent category is required" }, { status: 400 });
    }

    // Verify parent category exists and is a top-level category
    const parent = await findCategoryById(parentId);

    if (!parent) {
      return NextResponse.json({ error: "Selected parent category does not exist" }, { status: 400 });
    }

    let slug = body.slug ? slugify(body.slug) : slugify(name);
    // Ensure unique slug
    const existingSlug = await findCategoryBySlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const subcategory = await createCategory({
      name: name.trim(),
      slug,
      parentId,
      description: description?.trim() || null,
      image: image || null,
      publicId: publicId || null,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      isActive: isActive !== false,
    });

    subcategory.parent = { id: parent.id, name: parent.name, slug: parent.slug } as any;
    subcategory._count = { subProducts: 0 };

    revalidatePath("/");
    revalidatePath("/products");
    revalidateTag("categories", "max");
    revalidateTag("storefront", "max");

    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    console.error("Admin subcategories POST error:", error);
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}

