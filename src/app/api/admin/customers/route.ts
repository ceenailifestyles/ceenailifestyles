import { NextResponse } from "next/server";
import { findUsers } from "@/lib/repositories/user";
import { getAdminSession } from "@/lib/auth";
import { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await findUsers({
      where: { role: Role.CUSTOMER },
      orderBy: { createdAt: "desc" },
      includeOrderCount: true,
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Admin customers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

