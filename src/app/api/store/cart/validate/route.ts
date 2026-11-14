import { NextResponse } from "next/server";
import { findProductById } from "@/lib/repositories/product";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ isValid: true, itemStatuses: [] });
    }

    const itemStatuses: Array<{
      id: string;
      productId: string;
      name: string;
      inStock: boolean;
      availableStock: number;
      error?: string;
    }> = [];

    let allValid = true;

    for (const item of items) {
      const dbProduct = await findProductById(item.productId, {
        includeVariants: true,
      });

      if (!dbProduct || !dbProduct.isActive) {
        allValid = false;
        itemStatuses.push({
          id: item.id || item.productId,
          productId: item.productId,
          name: item.name || "Product",
          inStock: false,
          availableStock: 0,
          error: "Product is no longer available",
        });
        continue;
      }

      let effectiveStock = dbProduct.stock;
      if (Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
        const matched = dbProduct.variants.find((v) => {
          const matchSize = item.size
            ? v.size.trim().toLowerCase() === item.size.trim().toLowerCase()
            : true;
          const matchColor = item.color && v.colorName
            ? v.colorName.trim().toLowerCase() === item.color.trim().toLowerCase()
            : true;
          return matchSize && matchColor;
        });

        if (matched) {
          effectiveStock = matched.stock;
        } else {
          effectiveStock = dbProduct.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
        }
      }

      if (effectiveStock <= 0) {
        allValid = false;
        itemStatuses.push({
          id: item.id || item.productId,
          productId: item.productId,
          name: dbProduct.name,
          inStock: false,
          availableStock: 0,
          error: "Out of stock",
        });
      } else if (effectiveStock < item.quantity) {
        allValid = false;
        itemStatuses.push({
          id: item.id || item.productId,
          productId: item.productId,
          name: dbProduct.name,
          inStock: false,
          availableStock: effectiveStock,
          error: `Only ${effectiveStock} left in stock`,
        });
      } else {
        itemStatuses.push({
          id: item.id || item.productId,
          productId: item.productId,
          name: dbProduct.name,
          inStock: true,
          availableStock: effectiveStock,
        });
      }
    }

    return NextResponse.json({
      isValid: allValid,
      itemStatuses,
    });
  } catch (error) {
    console.error("Cart validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate cart stock." },
      { status: 500 }
    );
  }
}

