import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { findProducts } from "@/lib/repositories/product";
import { findCategories } from "@/lib/repositories/category";
import { findColors } from "@/lib/repositories/color";
import { findSizes } from "@/lib/repositories/size";
import AdminProductsTable from "./AdminProductsTable";

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: Promise<{ search?: string; categoryId?: string }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { search, categoryId } = await searchParams;

  const where: any = {};
  if (search) {
    where.search = search;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [products, categories, colors, sizes] = await Promise.all([
    findProducts({
      where,
      orderBy: { createdAt: "desc" },
      includeCategory: true,
      includeSubcategory: true,
      includeImages: true,
      includeVariants: true,
    }),
    findCategories({
      where: { parentId: null },
      orderBy: { displayOrder: "asc" },
      includeChildren: true,
    }),
    findColors({ name: "asc" }),
    findSizes({ displayOrder: "asc" }),
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
