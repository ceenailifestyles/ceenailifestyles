import { query, execute, generateId, toBoolean, toDate } from "@/lib/db";
import { Category } from "@/lib/types";

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    publicId: row.publicId,
    displayOrder: Number(row.displayOrder || 0),
    isActive: toBoolean(row.isActive),
    parentId: row.parentId,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findCategories(options?: {
  where?: {
    parentId?: string | null;
    isSubcategory?: boolean;
    isActive?: boolean;
    slug?: string;
  };
  includeChildren?: boolean;
  includeParent?: boolean;
  includeCounts?: boolean;
  orderBy?:
    | { displayOrder?: "asc" | "desc"; name?: "asc" | "desc"; parentId?: "asc" | "desc" }
    | Array<{ displayOrder?: "asc" | "desc"; name?: "asc" | "desc"; parentId?: "asc" | "desc" }>;
}): Promise<Category[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.where) {
    const { parentId, isSubcategory, isActive, slug } = options.where;
    if (parentId === null) {
      conditions.push("`parentId` IS NULL");
    } else if (parentId !== undefined) {
      conditions.push("`parentId` = ?");
      params.push(parentId);
    }
    if (isSubcategory) {
      conditions.push("`parentId` IS NOT NULL");
    }
    if (isActive !== undefined) {
      conditions.push("`isActive` = ?");
      params.push(isActive ? 1 : 0);
    }
    if (slug !== undefined) {
      conditions.push("`slug` = ?");
      params.push(slug);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderClause = "ORDER BY `displayOrder` ASC";
  if (Array.isArray(options?.orderBy)) {
    const parts: string[] = [];
    for (const ob of options.orderBy) {
      if (ob.parentId) parts.push(`\`parentId\` ${ob.parentId.toLowerCase() === "desc" ? "DESC" : "ASC"}`);
      if (ob.displayOrder) parts.push(`\`displayOrder\` ${ob.displayOrder.toLowerCase() === "desc" ? "DESC" : "ASC"}`);
      if (ob.name) parts.push(`\`name\` ${ob.name.toLowerCase() === "desc" ? "DESC" : "ASC"}`);
    }
    if (parts.length > 0) orderClause = `ORDER BY ${parts.join(", ")}`;
  } else if (options?.orderBy) {
    if (options.orderBy.parentId) {
      orderClause = `ORDER BY \`parentId\` ${options.orderBy.parentId.toLowerCase() === "desc" ? "DESC" : "ASC"}`;
    } else if (options.orderBy.name) {
      orderClause = `ORDER BY \`name\` ${options.orderBy.name.toLowerCase() === "desc" ? "DESC" : "ASC"}`;
    } else if (options.orderBy.displayOrder) {
      orderClause = `ORDER BY \`displayOrder\` ${options.orderBy.displayOrder.toLowerCase() === "desc" ? "DESC" : "ASC"}`;
    }
  }

  const rows = await query(`SELECT * FROM \`categories\` ${whereClause} ${orderClause}`, params);
  const categories = rows.map(mapCategory);

  if (options?.includeChildren && categories.length > 0) {
    const parentIds = categories.map((c) => c.id);
    const placeholders = parentIds.map(() => "?").join(",");
    const childActiveClause = options?.where?.isActive !== undefined ? (options.where.isActive ? " AND `isActive` = 1" : " AND `isActive` = 0") : "";
    const childRows = await query(
      `SELECT * FROM \`categories\` WHERE \`parentId\` IN (${placeholders})${childActiveClause} ORDER BY \`displayOrder\` ASC`,
      parentIds
    );
    const childrenMap = new Map<string, Category[]>();
    for (const row of childRows) {
      const child = mapCategory(row);
      if (child.parentId) {
        if (!childrenMap.has(child.parentId)) {
          childrenMap.set(child.parentId, []);
        }
        childrenMap.get(child.parentId)!.push(child);
      }
    }
    for (const cat of categories) {
      cat.children = childrenMap.get(cat.id) || [];
    }
  }

  if (options?.includeParent && categories.length > 0) {
    const parentIds = Array.from(new Set(categories.map((c) => c.parentId).filter(Boolean))) as string[];
    if (parentIds.length > 0) {
      const placeholders = parentIds.map(() => "?").join(",");
      const parentRows = await query(`SELECT * FROM \`categories\` WHERE \`id\` IN (${placeholders})`, parentIds);
      const parentMap = new Map(parentRows.map((r: any) => [r.id, mapCategory(r)]));
      for (const cat of categories) {
        cat.parent = cat.parentId ? parentMap.get(cat.parentId) || null : null;
      }
    }
  }

  if (options?.includeCounts && categories.length > 0) {
    const allCatIds = [
      ...categories.map((c) => c.id),
      ...categories.flatMap((c) => (c.children || []).map((ch) => ch.id)),
    ];
    if (allCatIds.length > 0) {
      const placeholders = allCatIds.map(() => "?").join(",");
      const [prodRows, subProdRows, childCounts] = await Promise.all([
        query(`SELECT \`categoryId\`, COUNT(*) as cnt FROM \`products\` WHERE \`categoryId\` IN (${placeholders}) GROUP BY \`categoryId\``, allCatIds),
        query(`SELECT \`subcategoryId\`, COUNT(*) as cnt FROM \`products\` WHERE \`subcategoryId\` IN (${placeholders}) GROUP BY \`subcategoryId\``, allCatIds),
        query(`SELECT \`parentId\`, COUNT(*) as cnt FROM \`categories\` WHERE \`parentId\` IN (${placeholders}) GROUP BY \`parentId\``, allCatIds),
      ]);

      const prodMap = new Map<string, number>(prodRows.map((r: any) => [r.categoryId, Number(r.cnt || 0)]));
      const subProdMap = new Map<string, number>(subProdRows.map((r: any) => [r.subcategoryId, Number(r.cnt || 0)]));
      const childCountMap = new Map<string, number>(childCounts.map((r: any) => [r.parentId, Number(r.cnt || 0)]));

      for (const cat of categories) {
        cat._count = {
          products: prodMap.get(cat.id) || 0,
          subProducts: subProdMap.get(cat.id) || 0,
          children: childCountMap.get(cat.id) || 0,
        };
        if (cat.children) {
          for (const ch of cat.children) {
            ch._count = {
              products: prodMap.get(ch.id) || 0,
              subProducts: subProdMap.get(ch.id) || 0,
              children: childCountMap.get(ch.id) || 0,
            };
          }
        }
      }
    }
  }

  return categories;
}

export async function findCategoryById(
  id: string,
  options?: { includeCounts?: boolean }
): Promise<Category | null> {
  const rows = await query("SELECT * FROM `categories` WHERE `id` = ? LIMIT 1", [id]);
  if (rows.length === 0) return null;
  const category = mapCategory(rows[0]);
  if (options?.includeCounts) {
    const [prodRows, childRows] = await Promise.all([
      query("SELECT COUNT(*) as cnt FROM `products` WHERE `categoryId` = ? OR `subcategoryId` = ?", [id, id]),
      query("SELECT COUNT(*) as cnt FROM `categories` WHERE `parentId` = ?", [id]),
    ]);
    category._count = {
      products: Number(prodRows[0]?.cnt || 0),
      children: Number(childRows[0]?.cnt || 0),
    };
  }
  return category;
}

export async function findCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await query("SELECT * FROM `categories` WHERE `slug` = ? LIMIT 1", [slug]);
  return rows.length > 0 ? mapCategory(rows[0]) : null;
}

export async function findFirstCategory(where: {
  name?: string;
  slug?: string;
  parentId?: string | null;
  NOT?: { id?: string };
}): Promise<Category | null> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where.name !== undefined) {
    conditions.push("LOWER(`name`) = LOWER(?)");
    params.push(where.name);
  }
  if (where.slug !== undefined) {
    conditions.push("`slug` = ?");
    params.push(where.slug);
  }
  if (where.parentId === null) {
    conditions.push("`parentId` IS NULL");
  } else if (where.parentId !== undefined) {
    conditions.push("`parentId` = ?");
    params.push(where.parentId);
  }
  if (where.NOT?.id !== undefined) {
    conditions.push("`id` != ?");
    params.push(where.NOT.id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT * FROM \`categories\` ${whereClause} LIMIT 1`, params);
  return rows.length > 0 ? mapCategory(rows[0]) : null;
}

export async function countCategories(where?: { parentId?: string | null }): Promise<number> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where?.parentId === null) {
    conditions.push("`parentId` IS NULL");
  } else if (where?.parentId !== undefined) {
    conditions.push("`parentId` = ?");
    params.push(where.parentId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT COUNT(*) as total FROM \`categories\` ${whereClause}`, params);
  return Number(rows[0]?.total || 0);
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  publicId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
}): Promise<Category> {
  const id = generateId();
  const now = new Date();

  await execute(
    `INSERT INTO \`categories\` (
      \`id\`, \`name\`, \`slug\`, \`description\`, \`image\`, \`publicId\`,
      \`displayOrder\`, \`isActive\`, \`parentId\`, \`createdAt\`, \`updatedAt\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.slug,
      data.description || null,
      data.image || null,
      data.publicId || null,
      data.displayOrder ?? 0,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.parentId || null,
      now,
      now,
    ]
  );

  return (await findCategoryById(id))!;
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    publicId: string | null;
    displayOrder: number;
    isActive: boolean;
    parentId: string | null;
  }>
): Promise<Category> {
  const setClauses: string[] = ["`updatedAt` = ?"];
  const params: any[] = [new Date()];

  if (data.name !== undefined) {
    setClauses.push("`name` = ?");
    params.push(data.name);
  }
  if (data.slug !== undefined) {
    setClauses.push("`slug` = ?");
    params.push(data.slug);
  }
  if (data.description !== undefined) {
    setClauses.push("`description` = ?");
    params.push(data.description);
  }
  if (data.image !== undefined) {
    setClauses.push("`image` = ?");
    params.push(data.image);
  }
  if (data.publicId !== undefined) {
    setClauses.push("`publicId` = ?");
    params.push(data.publicId);
  }
  if (data.displayOrder !== undefined) {
    setClauses.push("`displayOrder` = ?");
    params.push(data.displayOrder);
  }
  if (data.isActive !== undefined) {
    setClauses.push("`isActive` = ?");
    params.push(data.isActive ? 1 : 0);
  }
  if (data.parentId !== undefined) {
    setClauses.push("`parentId` = ?");
    params.push(data.parentId);
  }

  params.push(id);
  await execute("UPDATE `categories` SET " + setClauses.join(", ") + " WHERE `id` = ?", params);
  return (await findCategoryById(id))!;
}

export async function deleteCategory(id: string): Promise<Category> {
  const existing = await findCategoryById(id);
  if (!existing) throw new Error("Category not found");
  await execute("DELETE FROM `categories` WHERE `parentId` = ?", [id]);
  await execute("DELETE FROM `categories` WHERE `id` = ?", [id]);
  return existing;
}
