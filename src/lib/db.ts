import mysql, { Pool, PoolConnection } from "mysql2/promise";
import crypto from "crypto";

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

function parseDatabaseUrl(urlStr?: string) {
  if (!urlStr) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  // Handle standard mysql://user:password@host:port/database?params
  try {
    const parsed = new URL(urlStr);
    const user = decodeURIComponent(parsed.username || "root");
    const password = decodeURIComponent(parsed.password || "");
    const host = parsed.hostname || "127.0.0.1";
    const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    const database = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "";

    return { host, port, user, password, database };
  } catch {
    // Regex fallback if URL constructor fails on special characters
    const match = urlStr.match(/^mysql:\/\/([^:]+):([^@]+)@([^:/]+)(?::([0-9]+))?\/(.+?)(?:\?.*)?$/);
    if (!match) {
      throw new Error("Failed to parse DATABASE_URL");
    }
    return {
      user: decodeURIComponent(match[1]),
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: match[4] ? parseInt(match[4], 10) : 3306,
      database: match[5],
    };
  }
}

export function getPool(): Pool {
  if (globalThis.__mysqlPool) {
    return globalThis.__mysqlPool;
  }

  const { host, port, user, password, database } = parseDatabaseUrl(process.env.DATABASE_URL);

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 5,
    waitForConnections: true,
    enableKeepAlive: true,
    timezone: "Z",
    dateStrings: false,
    supportBigNumbers: true,
    decimalNumbers: true,
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__mysqlPool = pool;
  }

  return pool;
}

export function generateId(): string {
  // Generates 24-char clean unique ID compatible with existing cuid strings
  return "c" + crypto.randomBytes(12).toString("hex");
}

export function parseJsonField<T = any>(val: any): T {
  if (val === null || val === undefined) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val as unknown as T;
    }
  }
  return val as T;
}

export function toBoolean(val: any): boolean {
  if (val === null || val === undefined) return false;
  return val === 1 || val === true || val === "1";
}

export function toDate(val: any): Date {
  if (val instanceof Date) return val;
  return new Date(val);
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<{ affectedRows: number; insertId: number }> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  const r = result as any;
  return { affectedRows: r.affectedRows || 0, insertId: r.insertId || 0 };
}

export async function transaction<T>(callback: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export default {
  getPool,
  query,
  execute,
  transaction,
  generateId,
  parseJsonField,
  toBoolean,
  toDate,
};

