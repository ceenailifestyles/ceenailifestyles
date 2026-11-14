import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { findCollections } from "@/lib/repositories/collection";
import { findProducts } from "@/lib/repositories/product";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [collections, allProducts] = await Promise.all([
    findCollections({
      orderBy: { displayOrder: "asc" },
      includeProducts: true,
    }),
    findProducts({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">
          Curated & Seasonal Collections
        </h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage dynamic edits like Festive Edit, Diwali Edit, New Arrivals and Celebration Wear.
        </p>
      </div>

      <CollectionsClient
        initialCollections={collections as any}
        availableProducts={allProducts}
      />
    </div>
  );
}
