import React from "react";
import prisma from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { displayOrder: "asc" },
    include: {
      children: {
        orderBy: { displayOrder: "asc" },
        include: {
          _count: { select: { subProducts: true } },
        },
      },
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">
          Categories & Subcategories
        </h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage your primary fashion departments, subcategories, images, and hierarchy.
        </p>
      </div>

      <CategoriesClient initialCategories={categories as any} />
    </div>
  );
}
