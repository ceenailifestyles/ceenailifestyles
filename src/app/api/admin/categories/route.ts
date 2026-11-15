import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findCategories, findCategoryBySlug, createCategory } from "@/lib/repositories/category";
import { getAdminSession } from "@/lib/auth";
import { categorySchema, getZodErrorMessage } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await findCategories({
      where: { parentId: null },
      orderBy: { displayOrder: "asc" },
      includeChildren: true,
      includeCounts: true,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Admin categories GET error:", error);
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
    const validated = categorySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await findCategoryBySlug(data.slug);

    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await createCategory({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image: data.image || null,
      publicId: data.publicId || null,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      parentId: data.parentId || null,
    });

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Admin category POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
