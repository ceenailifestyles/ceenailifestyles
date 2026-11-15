import { query, execute, transaction, generateId, toBoolean, toDate, parseJsonField } from "@/lib/db";
import { Product, ProductImage, ProductVariant } from "@/lib/types";

export function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    shortDescription: row.shortDescription,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    sellingPrice: Number(row.sellingPrice),
    originalPrice: Number(row.originalPrice),
    discount: Number(row.discount || 0),
    productType: row.productType || "NORMAL",
    mainImage: row.mainImage,
    mainImageId: row.mainImageId,
    sizes: parseJsonField(row.sizes),
    colors: parseJsonField(row.colors),
    specifications: parseJsonField(row.specifications),
    stock: Number(row.stock || 0),
    isFeatured: toBoolean(row.isFeatured),
    isBestSeller: toBoolean(row.isBestSeller),
    isNewArrival: toBoolean(row.isNewArrival),
    isOffer: toBoolean(row.isOffer),
    isActive: toBoolean(row.isActive),
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.reviewCount || 0),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapProductImage(row: any): ProductImage {
  return {
    id: row.id,
    productId: row.productId,
    url: row.url,
    publicId: row.publicId,
    colorName: row.colorName,
    displayOrder: Number(row.displayOrder || 0),
    createdAt: toDate(row.createdAt),
  };
}

function mapProductVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    colorName: row.colorName,
    colorHex: row.colorHex,
    size: row.size,
    stock: Number(row.stock || 0),
    sku: row.sku,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

async function attachRelations(
  products: Product[],
  options?: {
    includeCategory?: boolean;
    includeSubcategory?: boolean;
    includeImages?: boolean;
    includeVariants?: boolean;
  }
) {
  if (products.length === 0) return;
  const productIds = products.map((p) => p.id);
  const idPlaceholders = productIds.map(() => "?").join(",");

  if (options?.includeCategory) {
    const catIds = Array.from(new Set(products.map((p) => p.categoryId).filter(Boolean)));
    if (catIds.length > 0) {
      const catPlaceholders = catIds.map(() => "?").join(",");
      const catRows = await query(`SELECT \`id\`, \`name\`, \`slug\` FROM \`categories\` WHERE \`id\` IN (${catPlaceholders})`, catIds);
      const catMap = new Map(catRows.map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug }]));
      for (const p of products) {
        p.category = catMap.get(p.categoryId) || null;
      }
    }
  }

  if (options?.includeSubcategory) {
    const subIds = Array.from(new Set(products.map((p) => p.subcategoryId).filter(Boolean))) as string[];
    if (subIds.length > 0) {
      const subPlaceholders = subIds.map(() => "?").join(",");
      const subRows = await query(`SELECT \`id\`, \`name\`, \`slug\` FROM \`categories\` WHERE \`id\` IN (${subPlaceholders})`, subIds);
      const subMap = new Map(subRows.map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug }]));
      for (const p of products) {
        p.subcategory = p.subcategoryId ? subMap.get(p.subcategoryId) || null : null;
      }
    }
  }

  if (options?.includeImages) {
    const imageRows = await query(
      `SELECT * FROM \`product_images\` WHERE \`productId\` IN (${idPlaceholders}) ORDER BY \`displayOrder\` ASC`,
      productIds
    );
    const imgMap = new Map<string, ProductImage[]>();
    for (const row of imageRows) {
      const img = mapProductImage(row);
      if (!imgMap.has(img.productId)) imgMap.set(img.productId, []);
      imgMap.get(img.productId)!.push(img);
    }
    for (const p of products) {
      p.images = imgMap.get(p.id) || [];
    }
  }

  if (options?.includeVariants) {
    const variantRows = await query(
      `SELECT * FROM \`product_variants\` WHERE \`productId\` IN (${idPlaceholders})`,
      productIds
    );
    const varMap = new Map<string, ProductVariant[]>();
    for (const row of variantRows) {
      const v = mapProductVariant(row);
      if (!varMap.has(v.productId)) varMap.set(v.productId, []);
      varMap.get(v.productId)!.push(v);
    }
    for (const p of products) {
      p.variants = varMap.get(p.id) || [];
    }
  }
}

export async function findProducts(options?: {
  where?: {
    isActive?: boolean;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isOffer?: boolean;
    categoryId?: string;
    subcategoryId?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    collectionSlug?: string;
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    discount?: { gte?: number };
    search?: string;
    stock?: { gt?: number; lte?: number };
    id?: { in?: string[] };
    NOT?: { id?: string };
  };
  orderBy?: {
    createdAt?: "asc" | "desc";
    sellingPrice?: "asc" | "desc";
    rating?: "asc" | "desc";
    stock?: "asc" | "desc";
    discount?: "asc" | "desc";
    name?: "asc" | "desc";
  };
  take?: number;
  skip?: number;
  includeCategory?: boolean;
  includeSubcategory?: boolean;
  includeImages?: boolean;
  includeVariants?: boolean;
}): Promise<Product[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.where) {
    const w = options.where;
    if (w.isActive !== undefined) {
      conditions.push("`isActive` = ?");
      params.push(w.isActive ? 1 : 0);
    }
    if (w.isFeatured !== undefined) {
      conditions.push("`isFeatured` = ?");
      params.push(w.isFeatured ? 1 : 0);
    }
    if (w.isBestSeller !== undefined) {
      conditions.push("`isBestSeller` = ?");
      params.push(w.isBestSeller ? 1 : 0);
    }
    if (w.isNewArrival !== undefined) {
      conditions.push("`isNewArrival` = ?");
      params.push(w.isNewArrival ? 1 : 0);
    }
    if (w.isOffer !== undefined) {
      conditions.push("`isOffer` = ?");
      params.push(w.isOffer ? 1 : 0);
    }
    if (w.categoryId !== undefined) {
      conditions.push("`categoryId` = ?");
      params.push(w.categoryId);
    }
    if (w.subcategoryId !== undefined) {
      conditions.push("`subcategoryId` = ?");
      params.push(w.subcategoryId);
    }
    if (w.categorySlug !== undefined) {
      conditions.push("`categoryId` IN (SELECT `id` FROM `categories` WHERE `slug` = ?)");
      params.push(w.categorySlug);
    }
    if (w.subcategorySlug !== undefined) {
      conditions.push("`subcategoryId` IN (SELECT `id` FROM `categories` WHERE `slug` = ?)");
      params.push(w.subcategorySlug);
    }
    if (w.collectionSlug !== undefined) {
      conditions.push("`id` IN (SELECT `productId` FROM `collection_products` cp JOIN `collections` c ON cp.`collectionId` = c.`id` WHERE c.`slug` = ? AND c.`isActive` = 1)");
      params.push(w.collectionSlug);
    }
    if (w.minPrice !== undefined) {
      conditions.push("`sellingPrice` >= ?");
      params.push(w.minPrice);
    }
    if (w.maxPrice !== undefined) {
      conditions.push("`sellingPrice` <= ?");
      params.push(w.maxPrice);
    }
    const targetDiscount = w.minDiscount !== undefined ? w.minDiscount : w.discount?.gte;
    if (targetDiscount !== undefined) {
      conditions.push("`discount` >= ?");
      params.push(targetDiscount);
    }
    if (w.stock?.gt !== undefined) {
      conditions.push("`stock` > ?");
      params.push(w.stock.gt);
    }
    if (w.stock?.lte !== undefined) {
      conditions.push("`stock` <= ?");
      params.push(w.stock.lte);
    }
    if (w.id?.in !== undefined) {
      if (w.id.in.length === 0) return [];
      const inPlaceholders = w.id.in.map(() => "?").join(",");
      conditions.push(`\`id\` IN (${inPlaceholders})`);
      params.push(...w.id.in);
    }
    if (w.NOT?.id !== undefined) {
      conditions.push("`id` != ?");
      params.push(w.NOT.id);
    }
    if (w.search) {
      conditions.push("(`name` LIKE ? OR `description` LIKE ? OR `shortDescription` LIKE ? OR `sku` LIKE ?)");
      const term = `%${w.search}%`;
      params.push(term, term, term, term);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderClause = "ORDER BY `createdAt` DESC";
  if (options?.orderBy?.discount) {
    orderClause = `ORDER BY \`discount\` ${options.orderBy.discount.toUpperCase()}`;
  } else if (options?.orderBy?.name) {
    orderClause = `ORDER BY \`name\` ${options.orderBy.name.toUpperCase()}`;
  } else if (options?.orderBy?.sellingPrice) {
    orderClause = `ORDER BY \`sellingPrice\` ${options.orderBy.sellingPrice.toUpperCase()}`;
  } else if (options?.orderBy?.rating) {
    orderClause = `ORDER BY \`rating\` ${options.orderBy.rating.toUpperCase()}`;
  } else if (options?.orderBy?.createdAt) {
    orderClause = `ORDER BY \`createdAt\` ${options.orderBy.createdAt.toUpperCase()}`;
  } else if (options?.orderBy?.stock) {
    orderClause = `ORDER BY \`stock\` ${options.orderBy.stock.toUpperCase()}`;
  }

  let limitClause = "";
  if (options?.take !== undefined) {
    limitClause = `LIMIT ${Number(options.take)}`;
    if (options?.skip !== undefined) {
      limitClause += ` OFFSET ${Number(options.skip)}`;
    }
  }

  const rows = await query(`SELECT * FROM \`products\` ${whereClause} ${orderClause} ${limitClause}`, params);
  const products = rows.map(mapProduct);

  await attachRelations(products, {
    includeCategory: options?.includeCategory,
    includeSubcategory: options?.includeSubcategory,
    includeImages: options?.includeImages,
    includeVariants: options?.includeVariants,
  });

  return products;
}

export async function countProducts(where?: {
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOffer?: boolean;
  categoryId?: string;
  subcategoryId?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  collectionSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  discount?: { gte?: number };
  search?: string;
  stock?: { gt?: number; lte?: number };
  id?: { in?: string[] };
}): Promise<number> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where) {
    if (where.isActive !== undefined) {
      conditions.push("`isActive` = ?");
      params.push(where.isActive ? 1 : 0);
    }
    if (where.isFeatured !== undefined) {
      conditions.push("`isFeatured` = ?");
      params.push(where.isFeatured ? 1 : 0);
    }
    if (where.isBestSeller !== undefined) {
      conditions.push("`isBestSeller` = ?");
      params.push(where.isBestSeller ? 1 : 0);
    }
    if (where.isNewArrival !== undefined) {
      conditions.push("`isNewArrival` = ?");
      params.push(where.isNewArrival ? 1 : 0);
    }
    if (where.isOffer !== undefined) {
      conditions.push("`isOffer` = ?");
      params.push(where.isOffer ? 1 : 0);
    }
    if (where.categoryId !== undefined) {
      conditions.push("`categoryId` = ?");
      params.push(where.categoryId);
    }
    if (where.subcategoryId !== undefined) {
      conditions.push("`subcategoryId` = ?");
      params.push(where.subcategoryId);
    }
    if (where.categorySlug !== undefined) {
      conditions.push("`categoryId` IN (SELECT `id` FROM `categories` WHERE `slug` = ?)");
      params.push(where.categorySlug);
    }
    if (where.subcategorySlug !== undefined) {
      conditions.push("`subcategoryId` IN (SELECT `id` FROM `categories` WHERE `slug` = ?)");
      params.push(where.subcategorySlug);
    }
    if (where.collectionSlug !== undefined) {
      conditions.push("`id` IN (SELECT `productId` FROM `collection_products` cp JOIN `collections` c ON cp.`collectionId` = c.`id` WHERE c.`slug` = ? AND c.`isActive` = 1)");
      params.push(where.collectionSlug);
    }
    if (where.minPrice !== undefined) {
      conditions.push("`sellingPrice` >= ?");
      params.push(where.minPrice);
    }
    if (where.maxPrice !== undefined) {
      conditions.push("`sellingPrice` <= ?");
      params.push(where.maxPrice);
    }
    const targetDiscount = where.minDiscount !== undefined ? where.minDiscount : where.discount?.gte;
    if (targetDiscount !== undefined) {
      conditions.push("`discount` >= ?");
      params.push(targetDiscount);
    }
    if (where.stock?.gt !== undefined) {
      conditions.push("`stock` > ?");
      params.push(where.stock.gt);
    }
    if (where.stock?.lte !== undefined) {
      conditions.push("`stock` <= ?");
      params.push(where.stock.lte);
    }
    if (where.id?.in !== undefined) {
      if (where.id.in.length === 0) return 0;
      const inPlaceholders = where.id.in.map(() => "?").join(",");
      conditions.push(`\`id\` IN (${inPlaceholders})`);
      params.push(...where.id.in);
    }
    if (where.search) {
      conditions.push("(`name` LIKE ? OR `description` LIKE ? OR `shortDescription` LIKE ? OR `sku` LIKE ?)");
      const term = `%${where.search}%`;
      params.push(term, term, term, term);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT COUNT(*) as total FROM \`products\` ${whereClause}`, params);
  return Number(rows[0]?.total || 0);
}

export async function findProductById(
  id: string,
  options?: {
    includeCategory?: boolean;
    includeSubcategory?: boolean;
    includeImages?: boolean;
    includeVariants?: boolean;
  }
): Promise<Product | null> {
  const rows = await query("SELECT * FROM `products` WHERE `id` = ? LIMIT 1", [id]);
  if (rows.length === 0) return null;

  const product = mapProduct(rows[0]);
  await attachRelations([product], options);
  return product;
}

export async function findProductBySlug(
  slug: string,
  options?: {
    includeCategory?: boolean;
    includeSubcategory?: boolean;
    includeImages?: boolean;
    includeVariants?: boolean;
  }
): Promise<Product | null> {
  const rows = await query("SELECT * FROM `products` WHERE `slug` = ? LIMIT 1", [slug]);
  if (rows.length === 0) return null;

  const product = mapProduct(rows[0]);
  await attachRelations([product], options);
  return product;
}

export async function findFirstProduct(where: {
  slug?: string;
  sku?: string;
  NOT?: { id?: string };
}): Promise<Product | null> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where.slug !== undefined) {
    conditions.push("`slug` = ?");
    params.push(where.slug);
  }
  if (where.sku !== undefined) {
    conditions.push("`sku` = ?");
    params.push(where.sku);
  }
  if (where.NOT?.id !== undefined) {
    conditions.push("`id` != ?");
    params.push(where.NOT.id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT * FROM \`products\` ${whereClause} LIMIT 1`, params);
  return rows.length > 0 ? mapProduct(rows[0]) : null;
}

export async function createProduct(data: {
  name: string;
  slug: string;
  sku?: string | null;
  description: string;
  shortDescription?: string | null;
  categoryId: string;
  subcategoryId?: string | null;
  sellingPrice: number;
  originalPrice: number;
  discount?: number;
  productType?: string;
  mainImage: string;
  mainImageId?: string | null;
  sizes?: any;
  colors?: any;
  specifications?: any;
  stock?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOffer?: boolean;
  isActive?: boolean;
  rating?: number;
  images?: Array<{ url: string; publicId?: string | null; colorName?: string | null; displayOrder?: number }>;
  variants?: Array<{ colorName?: string | null; colorHex?: string | null; size: string; stock: number; sku?: string | null }>;
}): Promise<Product> {
  return await transaction(async (conn) => {
    const id = generateId();
    const now = new Date();

    await conn.execute(
      `INSERT INTO \`products\` (
        \`id\`, \`name\`, \`slug\`, \`sku\`, \`description\`, \`shortDescription\`,
        \`categoryId\`, \`subcategoryId\`, \`sellingPrice\`, \`originalPrice\`, \`discount\`,
        \`productType\`, \`mainImage\`, \`mainImageId\`, \`sizes\`, \`colors\`, \`specifications\`,
        \`stock\`, \`isFeatured\`, \`isBestSeller\`, \`isNewArrival\`, \`isOffer\`, \`isActive\`,
        \`rating\`, \`reviewCount\`, \`createdAt\`, \`updatedAt\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.slug,
        data.sku || null,
        data.description,
        data.shortDescription || null,
        data.categoryId,
        data.subcategoryId || null,
        data.sellingPrice,
        data.originalPrice,
        data.discount ?? 0,
        data.productType || "NORMAL",
        data.mainImage,
        data.mainImageId || null,
        data.sizes ? JSON.stringify(data.sizes) : null,
        data.colors ? JSON.stringify(data.colors) : null,
        data.specifications ? JSON.stringify(data.specifications) : null,
        data.stock ?? 0,
        data.isFeatured ? 1 : 0,
        data.isBestSeller ? 1 : 0,
        data.isNewArrival !== undefined ? (data.isNewArrival ? 1 : 0) : 1,
        data.isOffer ? 1 : 0,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
        data.rating ?? 5.0,
        0,
        now,
        now,
      ]
    );

    if (data.images && data.images.length > 0) {
      for (const img of data.images) {
        await conn.execute(
          `INSERT INTO \`product_images\` (\`id\`, \`productId\`, \`url\`, \`publicId\`, \`colorName\`, \`displayOrder\`, \`createdAt\`)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), id, img.url, img.publicId || null, img.colorName || null, img.displayOrder ?? 0, now]
        );
      }
    }

    if (data.variants && data.variants.length > 0) {
      for (const v of data.variants) {
        await conn.execute(
          `INSERT INTO \`product_variants\` (\`id\`, \`productId\`, \`colorName\`, \`colorHex\`, \`size\`, \`stock\`, \`sku\`, \`createdAt\`, \`updatedAt\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), id, v.colorName || null, v.colorHex || null, v.size, v.stock ?? 0, v.sku || null, now, now]
        );
      }
    }

    const [rows] = await conn.query("SELECT * FROM `products` WHERE `id` = ? LIMIT 1", [id]);
    const product = mapProduct((rows as any[])[0]);
    await attachRelations([product], { includeCategory: true, includeSubcategory: true, includeImages: true, includeVariants: true });
    return product;
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    sku: string | null;
    description: string;
    shortDescription: string | null;
    categoryId: string;
    subcategoryId: string | null;
    sellingPrice: number;
    originalPrice: number;
    discount: number;
    productType: string;
    mainImage: string;
    mainImageId: string | null;
    sizes: any;
    colors: any;
    specifications: any;
    stock: number;
    isFeatured: boolean;
    isBestSeller: boolean;
    isNewArrival: boolean;
    isOffer: boolean;
    isActive: boolean;
    rating: number;
    images?: Array<{ url: string; publicId?: string | null; colorName?: string | null; displayOrder?: number }>;
    variants?: Array<{ colorName?: string | null; colorHex?: string | null; size: string; stock: number; sku?: string | null }>;
  }>
): Promise<Product> {
  return await transaction(async (conn) => {
    const now = new Date();
    const setClauses: string[] = ["`updatedAt` = ?"];
    const params: any[] = [now];

    const fields: Array<[keyof typeof data, string, (v: any) => any]> = [
      ["name", "`name`", (v) => v],
      ["slug", "`slug`", (v) => v],
      ["sku", "`sku`", (v) => v || null],
      ["description", "`description`", (v) => v],
      ["shortDescription", "`shortDescription`", (v) => v || null],
      ["categoryId", "`categoryId`", (v) => v],
      ["subcategoryId", "`subcategoryId`", (v) => v || null],
      ["sellingPrice", "`sellingPrice`", (v) => Number(v)],
      ["originalPrice", "`originalPrice`", (v) => Number(v)],
      ["discount", "`discount`", (v) => Number(v || 0)],
      ["productType", "`productType`", (v) => v],
      ["mainImage", "`mainImage`", (v) => v],
      ["mainImageId", "`mainImageId`", (v) => v || null],
      ["sizes", "`sizes`", (v) => (v ? JSON.stringify(v) : null)],
      ["colors", "`colors`", (v) => (v ? JSON.stringify(v) : null)],
      ["specifications", "`specifications`", (v) => (v ? JSON.stringify(v) : null)],
      ["stock", "`stock`", (v) => Number(v || 0)],
      ["isFeatured", "`isFeatured`", (v) => (v ? 1 : 0)],
      ["isBestSeller", "`isBestSeller`", (v) => (v ? 1 : 0)],
      ["isNewArrival", "`isNewArrival`", (v) => (v ? 1 : 0)],
      ["isOffer", "`isOffer`", (v) => (v ? 1 : 0)],
      ["isActive", "`isActive`", (v) => (v ? 1 : 0)],
      ["rating", "`rating`", (v) => Number(v || 5.0)],
    ];

    for (const [key, col, transform] of fields) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        params.push(transform(data[key]));
      }
    }

    params.push(id);
    await conn.execute(`UPDATE \`products\` SET ${setClauses.join(", ")} WHERE \`id\` = ?`, params);

    if (data.images !== undefined) {
      await conn.execute("DELETE FROM `product_images` WHERE `productId` = ?", [id]);
      for (const img of data.images) {
        await conn.execute(
          `INSERT INTO \`product_images\` (\`id\`, \`productId\`, \`url\`, \`publicId\`, \`colorName\`, \`displayOrder\`, \`createdAt\`)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), id, img.url, img.publicId || null, img.colorName || null, img.displayOrder ?? 0, now]
        );
      }
    }

    if (data.variants !== undefined) {
      await conn.execute("DELETE FROM `product_variants` WHERE `productId` = ?", [id]);
      for (const v of data.variants) {
        await conn.execute(
          `INSERT INTO \`product_variants\` (\`id\`, \`productId\`, \`colorName\`, \`colorHex\`, \`size\`, \`stock\`, \`sku\`, \`createdAt\`, \`updatedAt\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), id, v.colorName || null, v.colorHex || null, v.size, v.stock ?? 0, v.sku || null, now, now]
        );
      }
    }

    const [rows] = await conn.query("SELECT * FROM `products` WHERE `id` = ? LIMIT 1", [id]);
    const product = mapProduct((rows as any[])[0]);
    await attachRelations([product], { includeCategory: true, includeSubcategory: true, includeImages: true, includeVariants: true });
    return product;
  });
}

export async function deleteProduct(id: string): Promise<Product> {
  const existing = await findProductById(id, { includeImages: true, includeVariants: true });
  if (!existing) throw new Error("Product not found");

  await transaction(async (conn) => {
    await conn.execute("DELETE FROM `product_images` WHERE `productId` = ?", [id]);
    await conn.execute("DELETE FROM `product_variants` WHERE `productId` = ?", [id]);
    await conn.execute("DELETE FROM `collection_products` WHERE `productId` = ?", [id]);
    await conn.execute("DELETE FROM `wishlists` WHERE `productId` = ?", [id]);
    await conn.execute("DELETE FROM `products` WHERE `id` = ?", [id]);
  });

  return existing;
}

