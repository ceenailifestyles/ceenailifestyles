import React from "react";
import { findCategories } from "@/lib/repositories/category";
import SubcategoriesClient from "./SubcategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminSubcategoriesPage() {
  const [subcategories, parentCategories] = await Promise.all([
    findCategories({
      where: { isSubcategory: true },
      orderBy: [{ parentId: "asc" }, { displayOrder: "asc" }],
      includeParent: true,
      includeCounts: true,
    }),
    findCategories({
      where: { parentId: null },
      orderBy: { displayOrder: "asc" },
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
        initialSubcategories={subcategories as any}
        parentCategories={parentCategories}
      />
    </div>
  );
}

