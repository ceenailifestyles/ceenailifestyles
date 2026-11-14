import { NextResponse } from "next/server";
import { countProducts, findProducts } from "@/lib/repositories/product";
import { countCategories } from "@/lib/repositories/category";
import { countUsers } from "@/lib/repositories/user";
import { countOrders, findOrders, getRevenueSum } from "@/lib/repositories/order";
import { getAdminSession } from "@/lib/auth";
import { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      recentOrders,
      recentProducts,
      totalRevenue,
    ] = await Promise.all([
      countProducts(),
      countCategories({ parentId: null }),
      countUsers({ role: Role.CUSTOMER }),
      countOrders(),
      findOrders({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      findProducts({
        take: 5,
        orderBy: { createdAt: "desc" },
        includeCategory: true,
      }),
      getRevenueSum(),
    ]);

    return NextResponse.json({
      totalProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      totalRevenue,
      recentOrders,
      recentProducts,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

