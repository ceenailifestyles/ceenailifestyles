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

    const sizes = await prisma.size.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ sizes });
  } catch (error) {
    console.error("Admin sizes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sizes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, displayOrder } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Size label is required" }, { status: 400 });
    }

    const existing = await prisma.size.findUnique({
      where: { name: name.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Size "${name.trim().toUpperCase()}" already exists` },
        { status: 409 }
      );
    }

    const size = await prisma.size.create({
      data: {
        name: name.trim().toUpperCase(),
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      },
    });

    return NextResponse.json({ size }, { status: 201 });
  } catch (error) {
    console.error("Admin sizes POST error:", error);
    return NextResponse.json({ error: "Failed to create size" }, { status: 500 });
  }
}

