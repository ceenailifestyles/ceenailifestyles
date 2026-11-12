import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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

    let slug = body.slug ? slugify(body.slug) : slugify(name);
    // Check slug collision with other records
    const existing = await prisma.category.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const subcategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        parentId,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        image: image !== undefined ? (image || null) : undefined,
        publicId: publicId !== undefined ? (publicId || null) : undefined,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
        isActive: isActive !== false,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { subProducts: true } },
      },
    });

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

    // Check if subcategory has products
    const productCount = await prisma.product.count({
      where: { subcategoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subcategory because it is assigned to ${productCount} product(s). Please reassign or delete the products first.`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin subcategory DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}

