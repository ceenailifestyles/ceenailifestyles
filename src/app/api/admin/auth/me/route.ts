import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { findUserById } from "@/lib/repositories/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ admin: null }, { status: 401 });
    }

    const admin = await findUserById(session.userId);
    if (!admin) {
      return NextResponse.json({ admin: null }, { status: 401 });
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin me error:", error);
    return NextResponse.json({ admin: null }, { status: 500 });
  }
}
