import { NextResponse } from "next/server";
import { getCachedCategories } from "@/lib/cachedStorefront";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getCachedCategories();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Store categories API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

