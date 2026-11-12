import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { Role } from "@prisma/client";

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
      totalRevenueData,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count({ where: { parentId: null } }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          sellingPrice: true,
          stock: true,
          isActive: true,
          mainImage: true,
          category: { select: { name: true } },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
    ]);

    return NextResponse.json({
      totalProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenueData._sum.total || 0,
      recentOrders,
      recentProducts,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

