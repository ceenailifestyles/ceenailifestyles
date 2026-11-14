import { query, execute, generateId, toDate, parseJsonField } from "@/lib/db";
import { User, Role, Order } from "@/lib/types";

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    phone: row.phone,
    role: row.role as Role,
    addresses: parseJsonField(row.addresses),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await query("SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(?) LIMIT 1", [email]);
  return rows.length > 0 ? mapUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const rows = await query("SELECT * FROM `users` WHERE `id` = ? LIMIT 1", [id]);
  return rows.length > 0 ? mapUser(rows[0]) : null;
}

export async function findUsers(options?: {
  where?: { role?: Role };
  includeOrders?: boolean;
  includeOrderCount?: boolean;
  orderBy?: { createdAt?: "asc" | "desc" };
}): Promise<(User & { orders?: Order[]; _count: { orders: number } })[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.where?.role) {
    conditions.push("`role` = ?");
    params.push(options.where.role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dir = options?.orderBy?.createdAt?.toLowerCase() === "asc" ? "ASC" : "DESC";

  const rows = await query(`SELECT * FROM \`users\` ${whereClause} ORDER BY \`createdAt\` ${dir}`, params);
  const users = rows.map(mapUser) as (User & { orders?: Order[]; _count: { orders: number } })[];

  if (users.length > 0) {
    for (const u of users) {
      u._count = { orders: 0 };
    }

    if (options?.includeOrders || options?.includeOrderCount) {
      const userIds = users.map((u) => u.id);
      const placeholders = userIds.map(() => "?").join(",");
      const countRows = await query(
        `SELECT \`userId\`, COUNT(*) as cnt FROM \`orders\` WHERE \`userId\` IN (${placeholders}) GROUP BY \`userId\``,
        userIds
      );
      const countMap = new Map<string, number>(countRows.map((r: any) => [r.userId, Number(r.cnt || 0)]));
      for (const u of users) {
        u._count = { orders: countMap.get(u.id) || 0 };
      }

      if (options?.includeOrders) {
        const orderRows = await query(
          `SELECT \`id\`, \`orderNumber\`, \`userId\`, \`total\`, \`status\`, \`paymentStatus\`, \`createdAt\`
           FROM \`orders\` WHERE \`userId\` IN (${placeholders}) ORDER BY \`createdAt\` DESC`,
          userIds
        );

        const ordersMap = new Map<string, any[]>();
        for (const ord of orderRows) {
          if (!ordersMap.has(ord.userId)) ordersMap.set(ord.userId, []);
          ordersMap.get(ord.userId)!.push({
            ...ord,
            total: Number(ord.total),
            createdAt: toDate(ord.createdAt),
          });
        }

        for (const u of users) {
          u.orders = ordersMap.get(u.id) || [];
        }
      }
    }
  }

  return users;
}

export async function countUsers(where?: { role?: Role }): Promise<number> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where?.role) {
    conditions.push("`role` = ?");
    params.push(where.role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT COUNT(*) as total FROM \`users\` ${whereClause}`, params);
  return Number(rows[0]?.total || 0);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: Role;
  addresses?: any;
}): Promise<User> {
  const id = generateId();
  const now = new Date();
  const role = data.role || Role.CUSTOMER;

  await execute(
    `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`password\`, \`phone\`, \`role\`, \`addresses\`, \`createdAt\`, \`updatedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.email.toLowerCase(),
      data.password,
      data.phone || null,
      role,
      data.addresses ? JSON.stringify(data.addresses) : null,
      now,
      now,
    ]
  );

  return (await findUserById(id))!;
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<User> {
  const now = new Date();
  await execute("UPDATE `users` SET `password` = ?, `updatedAt` = ? WHERE `id` = ?", [passwordHash, now, id]);
  return (await findUserById(id))!;
}

