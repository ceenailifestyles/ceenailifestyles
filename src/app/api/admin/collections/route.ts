import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findCollections, findCollectionBySlug, createCollection } from "@/lib/repositories/collection";
import { getAdminSession } from "@/lib/auth";
import { collectionSchema, getZodErrorMessage } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await findCollections({
      orderBy: { displayOrder: "asc" },
      includeProducts: true,
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Admin collections GET error:", error);
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
    const validated = collectionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await findCollectionBySlug(data.slug);

    if (existing) {
      return NextResponse.json(
        { error: "A collection with this slug already exists" },
        { status: 409 }
      );
    }

    const collection = await createCollection({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      bannerImage: data.bannerImage || null,
      bannerPublicId: data.bannerPublicId || null,
      isActive: data.isActive,
      displayOrder: data.displayOrder,
      productIds: data.productIds,
    });

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error("Admin collection POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
