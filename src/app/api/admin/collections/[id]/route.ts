import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { collectionSchema, getZodErrorMessage } from "@/lib/validations";

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
    const updated = await prisma.$transaction(async (tx) => {
      await tx.collectionProduct.deleteMany({ where: { collectionId: id } });
      return tx.collection.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description || null,
          bannerImage: data.bannerImage || null,
          bannerPublicId: data.bannerPublicId || null,
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          products: {
            create: data.productIds.map((pId, idx) => ({
              productId: pId,
              displayOrder: idx,
            })),
          },
        },
        include: {
          products: { include: { product: true } },
        },
      });
    });

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
    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Collection deleted" });
  } catch (error) {
    console.error("Admin collection DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
