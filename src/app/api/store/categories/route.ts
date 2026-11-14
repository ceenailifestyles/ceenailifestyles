import { NextResponse } from "next/server";
import { findCategories } from "@/lib/repositories/category";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await findCategories({
      where: {
        parentId: null,
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
      includeChildren: true,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Store categories API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

