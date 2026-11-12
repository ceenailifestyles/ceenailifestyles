import React from "react";
import prisma from "@/lib/prisma";
import AdminProductsTable from "./AdminProductsTable";

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: Promise<{ search?: string; categoryId?: string }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { search, categoryId } = await searchParams;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [products, categories, colors, sizes] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        images: { orderBy: { displayOrder: "asc" } },
        variants: true,
      },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        children: {
          select: { id: true, name: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.color.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.size.findMany({
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Products Management</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage inventory, product types (Normal vs. Color-Wise), pricing, Cloudinary galleries, and stock.
        </p>
      </div>

      <AdminProductsTable
        products={products}
        categories={categories}
        colors={colors}
        sizes={sizes}
        currentSearch={search}
        currentCategoryId={categoryId}
      />
    </div>
  );
}
