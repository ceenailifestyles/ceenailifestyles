import React from "react";
import prisma from "@/lib/prisma";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const [collections, allProducts] = await Promise.all([
    prisma.collection.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true, sellingPrice: true },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, mainImage: true, sellingPrice: true },
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
