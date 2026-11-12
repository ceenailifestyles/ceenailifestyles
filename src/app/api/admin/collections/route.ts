import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { collectionSchema, getZodErrorMessage } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await prisma.collection.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                mainImage: true,
                sellingPrice: true,
                stock: true,
              },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
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
    const existing = await prisma.collection.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A collection with this slug already exists" },
        { status: 409 }
      );
    }

    const collection = await prisma.collection.create({
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

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error("Admin collection POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
