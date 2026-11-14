import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { findCategories } from "@/lib/repositories/category";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const categories = await findCategories({
    where: { parentId: null },
    orderBy: { displayOrder: "asc" },
    includeChildren: true,
    includeCounts: true,
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
