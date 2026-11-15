import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findCollectionById, updateCollection, deleteCollection } from "@/lib/repositories/collection";
import { getAdminSession } from "@/lib/auth";
import { collectionSchema, getZodErrorMessage } from "@/lib/validations";
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
    const validated = collectionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await findCollectionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const updated = await updateCollection(id, {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      bannerImage: data.bannerImage || null,
      bannerPublicId: data.bannerPublicId || null,
      isActive: data.isActive,
      displayOrder: data.displayOrder,
      productIds: data.productIds,
    });

    if (existing.bannerPublicId && existing.bannerPublicId !== (data.bannerPublicId || null)) {
      deleteFromCloudinary(existing.bannerPublicId).catch((err) => {
        console.error(`Failed to delete replaced Cloudinary asset for collection ${id}:`, err);
      });
    }

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true, collection: updated });
  } catch (error) {
    console.error("Admin collection PUT error:", error);
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
    const existing = await findCollectionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    await deleteCollection(id);

    if (existing.bannerPublicId) {
      deleteFromCloudinary(existing.bannerPublicId).catch((err) => {
        console.error(`Failed to delete Cloudinary asset for collection ${id}:`, err);
      });
    }

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true, message: "Collection deleted" });
  } catch (error) {
    console.error("Admin collection DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
