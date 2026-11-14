import { query, execute, generateId, toBoolean, toDate } from "@/lib/db";
import { Banner } from "@/lib/types";

function mapBanner(row: any): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    desktopImage: row.desktopImage,
    desktopPublicId: row.desktopPublicId,
    mobileImage: row.mobileImage,
    mobilePublicId: row.mobilePublicId,
    ctaText: row.ctaText,
    ctaLink: row.ctaLink,
    displayOrder: Number(row.displayOrder || 0),
    isActive: toBoolean(row.isActive),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findBanners(where?: { isActive?: boolean }, orderBy?: { displayOrder?: "asc" | "desc" }): Promise<Banner[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where?.isActive !== undefined) {
    conditions.push("`isActive` = ?");
    params.push(where.isActive ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderDirection = orderBy?.displayOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";
  const orderClause = `ORDER BY \`displayOrder\` ${orderDirection}`;

  const rows = await query(`SELECT * FROM \`banners\` ${whereClause} ${orderClause}`, params);
  return rows.map(mapBanner);
}

export async function findBannerById(id: string): Promise<Banner | null> {
  const rows = await query("SELECT * FROM `banners` WHERE `id` = ? LIMIT 1", [id]);
  return rows.length > 0 ? mapBanner(rows[0]) : null;
}

export async function createBanner(data: {
  title: string;
  subtitle?: string | null;
  desktopImage: string;
  desktopPublicId?: string | null;
  mobileImage?: string | null;
  mobilePublicId?: string | null;
  ctaText?: string;
  ctaLink?: string;
  displayOrder?: number;
  isActive?: boolean;
}): Promise<Banner> {
  const id = generateId();
  const now = new Date();
  const ctaText = data.ctaText ?? "Shop Now";
  const ctaLink = data.ctaLink ?? "/products";
  const displayOrder = data.displayOrder ?? 0;
  const isActive = data.isActive ?? true;

  await execute(
    `INSERT INTO \`banners\` (
      \`id\`, \`title\`, \`subtitle\`, \`desktopImage\`, \`desktopPublicId\`,
      \`mobileImage\`, \`mobilePublicId\`, \`ctaText\`, \`ctaLink\`,
      \`displayOrder\`, \`isActive\`, \`createdAt\`, \`updatedAt\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.subtitle || null,
      data.desktopImage,
      data.desktopPublicId || null,
      data.mobileImage || null,
      data.mobilePublicId || null,
      ctaText,
      ctaLink,
      displayOrder,
      isActive ? 1 : 0,
      now,
      now,
    ]
  );

  return (await findBannerById(id))!;
}

export async function updateBanner(
  id: string,
  data: Partial<{
    title: string;
    subtitle: string | null;
    desktopImage: string;
    desktopPublicId: string | null;
    mobileImage: string | null;
    mobilePublicId: string | null;
    ctaText: string;
    ctaLink: string;
    displayOrder: number;
    isActive: boolean;
  }>
): Promise<Banner> {
  const setClauses: string[] = ["`updatedAt` = ?"];
  const params: any[] = [new Date()];

  if (data.title !== undefined) {
    setClauses.push("`title` = ?");
    params.push(data.title);
  }
  if (data.subtitle !== undefined) {
    setClauses.push("`subtitle` = ?");
    params.push(data.subtitle);
  }
  if (data.desktopImage !== undefined) {
    setClauses.push("`desktopImage` = ?");
    params.push(data.desktopImage);
  }
  if (data.desktopPublicId !== undefined) {
    setClauses.push("`desktopPublicId` = ?");
    params.push(data.desktopPublicId);
  }
  if (data.mobileImage !== undefined) {
    setClauses.push("`mobileImage` = ?");
    params.push(data.mobileImage);
  }
  if (data.mobilePublicId !== undefined) {
    setClauses.push("`mobilePublicId` = ?");
    params.push(data.mobilePublicId);
  }
  if (data.ctaText !== undefined) {
    setClauses.push("`ctaText` = ?");
    params.push(data.ctaText);
  }
  if (data.ctaLink !== undefined) {
    setClauses.push("`ctaLink` = ?");
    params.push(data.ctaLink);
  }
  if (data.displayOrder !== undefined) {
    setClauses.push("`displayOrder` = ?");
    params.push(data.displayOrder);
  }
  if (data.isActive !== undefined) {
    setClauses.push("`isActive` = ?");
    params.push(data.isActive ? 1 : 0);
  }

  params.push(id);
  await execute("UPDATE `banners` SET " + setClauses.join(", ") + " WHERE `id` = ?", params);
  return (await findBannerById(id))!;
}

export async function deleteBanner(id: string): Promise<Banner> {
  const existing = await findBannerById(id);
  if (!existing) throw new Error("Banner not found");
  await execute("DELETE FROM `banners` WHERE `id` = ?", [id]);
  return existing;
}
