import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const colors = await prisma.color.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Admin colors GET error:", error);
    return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, hex } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Color name is required" }, { status: 400 });
    }

    if (!hex || typeof hex !== "string" || !hex.trim()) {
      return NextResponse.json({ error: "Color hex code is required" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.color.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Color "${name.trim()}" already exists` },
        { status: 409 }
      );
    }

    const color = await prisma.color.create({
      data: {
        name: name.trim(),
        hex: hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`,
      },
    });

    return NextResponse.json({ color }, { status: 201 });
  } catch (error) {
    console.error("Admin colors POST error:", error);
    return NextResponse.json({ error: "Failed to create color" }, { status: 500 });
  }
}

