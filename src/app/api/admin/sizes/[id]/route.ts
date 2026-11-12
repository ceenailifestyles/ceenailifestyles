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
    const { name, displayOrder } = body;

    if (!name) {
      return NextResponse.json({ error: "Size label is required" }, { status: 400 });
    }

    const size = await prisma.size.update({
      where: { id },
      data: {
        name: name.trim().toUpperCase(),
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      },
    });

    return NextResponse.json({ size });
  } catch (error) {
    console.error("Admin size PUT error:", error);
    return NextResponse.json({ error: "Failed to update size" }, { status: 500 });
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

    await prisma.size.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin size DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete size" }, { status: 500 });
  }
}

