import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ isValid: true, itemStatuses: [] });
    }

    // Cap items to 50
    if (items.length > 50) {
      return NextResponse.json(
        { error: "Cart item count exceeds maximum limit of 50 items" },
        { status: 400 }
      );
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

    // Collect unique productIds and variantIds, guarding against empty/falsy values
    const productIds = Array.from(
      new Set(items.map((i: any) => i?.productId).filter(Boolean))
    ) as string[];

    const variantIds = Array.from(
      new Set(items.map((i: any) => i?.variantId).filter(Boolean))
    ) as string[];

    if (productIds.length === 0) {
      return NextResponse.json({ isValid: true, itemStatuses: [] });
    }

    // 1. One batch query for products (WHERE id IN (...), guard against empty array)
    const prodPlaceholders = productIds.map(() => "?").join(",");
    const productRows = await query<any>(
      `SELECT * FROM \`products\` WHERE \`id\` IN (${prodPlaceholders})`,
      productIds
    );

    // 2. One batch query for variants (WHERE id IN (...) or WHERE productId IN (...), guard against empty array)
    let variantRows: any[] = [];
    if (variantIds.length > 0) {
      const varPlaceholders = variantIds.map(() => "?").join(",");
      variantRows = await query<any>(
        `SELECT * FROM \`product_variants\` WHERE \`id\` IN (${varPlaceholders})`,
        variantIds
      );
    } else if (productIds.length > 0) {
      variantRows = await query<any>(
        `SELECT * FROM \`product_variants\` WHERE \`productId\` IN (${prodPlaceholders})`,
        productIds
      );
    }

    // Index products and variants in memory
    const productMap = new Map<string, any>();
    for (const p of productRows) {
      productMap.set(p.id, {
        ...p,
        stock: Number(p.stock || 0),
        isActive: Boolean(p.isActive),
        variants: [],
      });
    }

    const variantById = new Map<string, any>();
    for (const v of variantRows) {
      const parsedVariant = { ...v, stock: Number(v.stock || 0) };
      variantById.set(v.id, parsedVariant);
      const prod = productMap.get(v.productId);
      if (prod) {
        prod.variants.push(parsedVariant);
      }
    }

    // 3. Match items against indexed products and variants in memory
    for (const item of items) {
      const dbProduct = productMap.get(item.productId);

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

      if (item.variantId && variantById.has(item.variantId)) {
        effectiveStock = variantById.get(item.variantId)!.stock;
      } else if (Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
        const matched = dbProduct.variants.find((v: any) => {
          const matchSize = item.size
            ? v.size?.trim().toLowerCase() === item.size.trim().toLowerCase()
            : true;
          const matchColor = item.color && v.colorName
            ? v.colorName?.trim().toLowerCase() === item.color.trim().toLowerCase()
            : true;
          return matchSize && matchColor;
        });

        if (matched) {
          effectiveStock = matched.stock;
        } else {
          effectiveStock = dbProduct.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
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
