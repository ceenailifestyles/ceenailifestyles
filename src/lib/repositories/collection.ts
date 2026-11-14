import { query, execute, transaction, generateId, toBoolean, toDate } from "@/lib/db";
import { Collection, CollectionProduct, Product } from "@/lib/types";
import { mapProduct } from "@/lib/repositories/product";

function mapCollection(row: any): Collection {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    bannerImage: row.bannerImage,
    bannerPublicId: row.bannerPublicId,
    isActive: toBoolean(row.isActive),
    startDate: row.startDate ? toDate(row.startDate) : null,
    endDate: row.endDate ? toDate(row.endDate) : null,
    displayOrder: Number(row.displayOrder || 0),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

async function attachCollectionProducts(collections: Collection[], includeProduct = false) {
  if (collections.length === 0) return;
  const colIds = collections.map((c) => c.id);
  const placeholders = colIds.map(() => "?").join(",");

  const cpRows = await query(
    `SELECT * FROM \`collection_products\` WHERE \`collectionId\` IN (${placeholders}) ORDER BY \`displayOrder\` ASC`,
    colIds
  );

  let productMap = new Map<string, Product>();
  if (includeProduct && cpRows.length > 0) {
    const productIds = Array.from(new Set(cpRows.map((r: any) => r.productId)));
    const pPlaceholders = productIds.map(() => "?").join(",");
    const pRows = await query(`SELECT * FROM \`products\` WHERE \`id\` IN (${pPlaceholders})`, productIds);
    productMap = new Map(pRows.map((p: any) => [p.id, mapProduct(p)]));
  }

  const cpMap = new Map<string, (CollectionProduct & { product?: Product })[]>();
  for (const row of cpRows) {
    const cp: CollectionProduct & { product?: Product } = {
      id: row.id,
      collectionId: row.collectionId,
      productId: row.productId,
      displayOrder: Number(row.displayOrder || 0),
    };
    if (includeProduct) {
      cp.product = productMap.get(cp.productId);
    }
    if (!cpMap.has(cp.collectionId)) cpMap.set(cp.collectionId, []);
    cpMap.get(cp.collectionId)!.push(cp);
  }

  for (const c of collections) {
    c.products = cpMap.get(c.id) || [];
  }
}

export async function findCollections(options?: {
  where?: { isActive?: boolean; slug?: string };
  includeProducts?: boolean;
  orderBy?: { displayOrder?: "asc" | "desc" };
  take?: number;
}): Promise<Collection[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.where?.isActive !== undefined) {
    conditions.push("`isActive` = ?");
    params.push(options.where.isActive ? 1 : 0);
  }
  if (options?.where?.slug !== undefined) {
    conditions.push("`slug` = ?");
    params.push(options.where.slug);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderDirection = options?.orderBy?.displayOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";
  const orderClause = `ORDER BY \`displayOrder\` ${orderDirection}`;
  const limitClause = options?.take ? ` LIMIT ${Number(options.take)}` : "";

  const rows = await query(`SELECT * FROM \`collections\` ${whereClause} ${orderClause}${limitClause}`, params);
  const collections = rows.map(mapCollection);

  if (options?.includeProducts) {
    await attachCollectionProducts(collections, true);
  }

  return collections;
}

export async function findFirstCollection(options?: {
  where?: { isActive?: boolean; slug?: string };
  includeProducts?: boolean;
  orderBy?: { displayOrder?: "asc" | "desc" };
}): Promise<Collection | null> {
  const list = await findCollections({ ...options, orderBy: options?.orderBy || { displayOrder: "asc" } });
  return list.length > 0 ? list[0] : null;
}

export async function findCollectionById(id: string, includeProducts = false): Promise<Collection | null> {
  const rows = await query("SELECT * FROM `collections` WHERE `id` = ? LIMIT 1", [id]);
  if (rows.length === 0) return null;
  const col = mapCollection(rows[0]);
  if (includeProducts) {
    await attachCollectionProducts([col], true);
  }
  return col;
}

export async function findCollectionBySlug(slug: string, includeProducts = false): Promise<Collection | null> {
  const rows = await query("SELECT * FROM `collections` WHERE `slug` = ? LIMIT 1", [slug]);
  if (rows.length === 0) return null;
  const col = mapCollection(rows[0]);
  if (includeProducts) {
    await attachCollectionProducts([col], true);
  }
  return col;
}

export async function createCollection(data: {
  title: string;
  slug: string;
  description?: string | null;
  bannerImage?: string | null;
  bannerPublicId?: string | null;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  displayOrder?: number;
  productIds?: string[];
}): Promise<Collection> {
  return await transaction(async (conn) => {
    const id = generateId();
    const now = new Date();

    await conn.execute(
      `INSERT INTO \`collections\` (
        \`id\`, \`title\`, \`slug\`, \`description\`, \`bannerImage\`, \`bannerPublicId\`,
        \`isActive\`, \`startDate\`, \`endDate\`, \`displayOrder\`, \`createdAt\`, \`updatedAt\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.slug,
        data.description || null,
        data.bannerImage || null,
        data.bannerPublicId || null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
        data.startDate || null,
        data.endDate || null,
        data.displayOrder ?? 0,
        now,
        now,
      ]
    );

    if (data.productIds && data.productIds.length > 0) {
      for (let i = 0; i < data.productIds.length; i++) {
        await conn.execute(
          `INSERT INTO \`collection_products\` (\`id\`, \`collectionId\`, \`productId\`, \`displayOrder\`)
           VALUES (?, ?, ?, ?)`,
          [generateId(), id, data.productIds[i], i]
        );
      }
    }

    const [rows] = await conn.query("SELECT * FROM `collections` WHERE `id` = ? LIMIT 1", [id]);
    const col = mapCollection((rows as any[])[0]);
    await attachCollectionProducts([col], true);
    return col;
  });
}

export async function updateCollection(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string | null;
    bannerImage: string | null;
    bannerPublicId: string | null;
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
    displayOrder: number;
    productIds?: string[];
  }>
): Promise<Collection> {
  return await transaction(async (conn) => {
    const now = new Date();
    const setClauses: string[] = ["`updatedAt` = ?"];
    const params: any[] = [now];

    if (data.title !== undefined) {
      setClauses.push("`title` = ?");
      params.push(data.title);
    }
    if (data.slug !== undefined) {
      setClauses.push("`slug` = ?");
      params.push(data.slug);
    }
    if (data.description !== undefined) {
      setClauses.push("`description` = ?");
      params.push(data.description);
    }
    if (data.bannerImage !== undefined) {
      setClauses.push("`bannerImage` = ?");
      params.push(data.bannerImage);
    }
    if (data.bannerPublicId !== undefined) {
      setClauses.push("`bannerPublicId` = ?");
      params.push(data.bannerPublicId);
    }
    if (data.isActive !== undefined) {
      setClauses.push("`isActive` = ?");
      params.push(data.isActive ? 1 : 0);
    }
    if (data.startDate !== undefined) {
      setClauses.push("`startDate` = ?");
      params.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      setClauses.push("`endDate` = ?");
      params.push(data.endDate);
    }
    if (data.displayOrder !== undefined) {
      setClauses.push("`displayOrder` = ?");
      params.push(data.displayOrder);
    }

    params.push(id);
    await conn.execute(`UPDATE \`collections\` SET ${setClauses.join(", ")} WHERE \`id\` = ?`, params);

    if (data.productIds !== undefined) {
      await conn.execute("DELETE FROM `collection_products` WHERE `collectionId` = ?", [id]);
      for (let i = 0; i < data.productIds.length; i++) {
        await conn.execute(
          `INSERT INTO \`collection_products\` (\`id\`, \`collectionId\`, \`productId\`, \`displayOrder\`)
           VALUES (?, ?, ?, ?)`,
          [generateId(), id, data.productIds[i], i]
        );
      }
    }

    const [rows] = await conn.query("SELECT * FROM `collections` WHERE `id` = ? LIMIT 1", [id]);
    const col = mapCollection((rows as any[])[0]);
    await attachCollectionProducts([col], true);
    return col;
  });
}

export async function deleteCollection(id: string): Promise<Collection> {
  const existing = await findCollectionById(id);
  if (!existing) throw new Error("Collection not found");
  await transaction(async (conn) => {
    await conn.execute("DELETE FROM `collection_products` WHERE `collectionId` = ?", [id]);
    await conn.execute("DELETE FROM `collections` WHERE `id` = ?", [id]);
  });
  return existing;
}

