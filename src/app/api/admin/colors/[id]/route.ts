import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

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
    const { name, hex } = body;

    if (!name || !hex) {
      return NextResponse.json(
        { error: "Name and hex code are required" },
        { status: 400 }
      );
    }

    const color = await prisma.color.update({
      where: { id },
      data: {
        name: name.trim(),
        hex: hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`,
      },
    });

    return NextResponse.json({ color });
  } catch (error) {
    console.error("Admin color PUT error:", error);
    return NextResponse.json({ error: "Failed to update color" }, { status: 500 });
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

    await prisma.color.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin color DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete color" }, { status: 500 });
  }
}

