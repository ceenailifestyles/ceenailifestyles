import { query, execute, generateId, toDate } from "@/lib/db";
import { Size } from "@/lib/types";

function mapSize(row: any): Size {
  return {
    id: row.id,
    name: row.name,
    displayOrder: Number(row.displayOrder || 0),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findSizes(orderBy?: { displayOrder?: "asc" | "desc" }): Promise<Size[]> {
  const dir = orderBy?.displayOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";
  const rows = await query(`SELECT * FROM \`sizes\` ORDER BY \`displayOrder\` ${dir}`);
  return rows.map(mapSize);
}

export async function findSizeById(id: string): Promise<Size | null> {
  const rows = await query("SELECT * FROM `sizes` WHERE `id` = ? LIMIT 1", [id]);
  return rows.length > 0 ? mapSize(rows[0]) : null;
}

export async function findSizeByName(name: string): Promise<Size | null> {
  const rows = await query("SELECT * FROM `sizes` WHERE LOWER(`name`) = LOWER(?) LIMIT 1", [name]);
  return rows.length > 0 ? mapSize(rows[0]) : null;
}

export async function createSize(data: { name: string; displayOrder?: number }): Promise<Size> {
  const id = generateId();
  const now = new Date();
  await execute(
    "INSERT INTO `sizes` (`id`, `name`, `displayOrder`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?)",
    [id, data.name, data.displayOrder ?? 0, now, now]
  );
  return (await findSizeById(id))!;
}

export async function updateSize(id: string, data: Partial<{ name: string; displayOrder: number }>): Promise<Size> {
  const setClauses: string[] = ["`updatedAt` = ?"];
  const params: any[] = [new Date()];

  if (data.name !== undefined) {
    setClauses.push("`name` = ?");
    params.push(data.name);
  }
  if (data.displayOrder !== undefined) {
    setClauses.push("`displayOrder` = ?");
    params.push(data.displayOrder);
  }

  params.push(id);
  await execute(`UPDATE \`sizes\` SET ${setClauses.join(", ")} WHERE \`id\` = ?`, params);
  return (await findSizeById(id))!;
}

export async function deleteSize(id: string): Promise<Size> {
  const existing = await findSizeById(id);
  if (!existing) throw new Error("Size not found");
  await execute("DELETE FROM `sizes` WHERE `id` = ?", [id]);
  return existing;
}

