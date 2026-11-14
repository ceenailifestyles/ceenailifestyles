import { query, execute, generateId, toDate } from "@/lib/db";
import { Color } from "@/lib/types";

function mapColor(row: any): Color {
  return {
    id: row.id,
    name: row.name,
    hex: row.hex,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findColors(orderBy?: { name?: "asc" | "desc" }): Promise<Color[]> {
  const dir = orderBy?.name?.toLowerCase() === "desc" ? "DESC" : "ASC";
  const rows = await query(`SELECT * FROM \`colors\` ORDER BY \`name\` ${dir}`);
  return rows.map(mapColor);
}

export async function findColorById(id: string): Promise<Color | null> {
  const rows = await query("SELECT * FROM `colors` WHERE `id` = ? LIMIT 1", [id]);
  return rows.length > 0 ? mapColor(rows[0]) : null;
}

export async function findColorByName(name: string): Promise<Color | null> {
  const rows = await query("SELECT * FROM `colors` WHERE LOWER(`name`) = LOWER(?) LIMIT 1", [name]);
  return rows.length > 0 ? mapColor(rows[0]) : null;
}

export async function createColor(data: { name: string; hex: string }): Promise<Color> {
  const id = generateId();
  const now = new Date();
  await execute(
    "INSERT INTO `colors` (`id`, `name`, `hex`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?)",
    [id, data.name, data.hex, now, now]
  );
  return (await findColorById(id))!;
}

export async function updateColor(id: string, data: Partial<{ name: string; hex: string }>): Promise<Color> {
  const setClauses: string[] = ["`updatedAt` = ?"];
  const params: any[] = [new Date()];

  if (data.name !== undefined) {
    setClauses.push("`name` = ?");
    params.push(data.name);
  }
  if (data.hex !== undefined) {
    setClauses.push("`hex` = ?");
    params.push(data.hex);
  }

  params.push(id);
  await execute(`UPDATE \`colors\` SET ${setClauses.join(", ")} WHERE \`id\` = ?`, params);
  return (await findColorById(id))!;
}

export async function deleteColor(id: string): Promise<Color> {
  const existing = await findColorById(id);
  if (!existing) throw new Error("Color not found");
  await execute("DELETE FROM `colors` WHERE `id` = ?", [id]);
  return existing;
}

