import React from "react";
import prisma from "@/lib/prisma";
import SubcategoriesClient from "./SubcategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminSubcategoriesPage() {
  const [subcategories, parentCategories] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: [{ parentId: "asc" }, { displayOrder: "asc" }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { subProducts: true } },
      },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Subcategories Management</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage, create, edit, and assign subcategories to parent categories. All changes reflect instantly in product creation and customer storefront.
        </p>
      </div>

      <SubcategoriesClient
        initialSubcategories={subcategories}
        parentCategories={parentCategories}
      />
    </div>
  );
}

