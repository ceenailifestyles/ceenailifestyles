import { query, execute, generateId, toDate, parseJsonField } from "@/lib/db";
import { SiteSetting } from "@/lib/types";

function mapSiteSetting(row: any): SiteSetting {
  return {
    id: row.id,
    key: row.key,
    value: parseJsonField(row.value),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findSiteSettings(where?: { key?: { in?: string[] } }): Promise<SiteSetting[]> {
  if (where?.key?.in) {
    if (where.key.in.length === 0) return [];
    const placeholders = where.key.in.map(() => "?").join(",");
    const rows = await query(`SELECT * FROM \`site_settings\` WHERE \`key\` IN (${placeholders})`, where.key.in);
    return rows.map(mapSiteSetting);
  }
  const rows = await query("SELECT * FROM `site_settings`");
  return rows.map(mapSiteSetting);
}

export async function findSiteSettingByKey(key: string): Promise<SiteSetting | null> {
  const rows = await query("SELECT * FROM `site_settings` WHERE `key` = ? LIMIT 1", [key]);
  return rows.length > 0 ? mapSiteSetting(rows[0]) : null;
}

export async function upsertSiteSetting(key: string, value: any): Promise<SiteSetting> {
  const now = new Date();
  const id = generateId();
  const jsonValue = JSON.stringify(value);

  await execute(
    `INSERT INTO \`site_settings\` (\`id\`, \`key\`, \`value\`, \`updatedAt\`)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), \`updatedAt\` = VALUES(\`updatedAt\`)`,
    [id, key, jsonValue, now]
  );

  return (await findSiteSettingByKey(key))!;
}

