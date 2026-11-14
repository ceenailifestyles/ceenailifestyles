import { query, execute, transaction, generateId, toDate } from "@/lib/db";
import { PasswordReset } from "@/lib/types";

function mapPasswordReset(row: any): PasswordReset {
  return {
    id: row.id,
    email: row.email,
    token: row.token,
    expiresAt: toDate(row.expiresAt),
    usedAt: row.usedAt ? toDate(row.usedAt) : null,
    createdAt: toDate(row.createdAt),
  };
}

export async function createPasswordReset(email: string, token: string, expiresAt: Date): Promise<PasswordReset> {
  const id = generateId();
  const now = new Date();
  await execute(
    "INSERT INTO `password_resets` (`id`, `email`, `token`, `expiresAt`, `createdAt`) VALUES (?, ?, ?, ?, ?)",
    [id, email.toLowerCase(), token, expiresAt, now]
  );
  const rows = await query("SELECT * FROM `password_resets` WHERE `id` = ? LIMIT 1", [id]);
  return mapPasswordReset(rows[0]);
}

export async function findPasswordResetByToken(token: string): Promise<PasswordReset | null> {
  const rows = await query("SELECT * FROM `password_resets` WHERE `token` = ? LIMIT 1", [token]);
  return rows.length > 0 ? mapPasswordReset(rows[0]) : null;
}

export async function findPasswordReset(email: string, token: string): Promise<PasswordReset | null> {
  const rows = await query(
    "SELECT * FROM `password_resets` WHERE LOWER(`email`) = LOWER(?) AND `token` = ? ORDER BY `createdAt` DESC LIMIT 1",
    [email, token]
  );
  return rows.length > 0 ? mapPasswordReset(rows[0]) : null;
}

export async function deletePasswordResetsByEmail(email: string): Promise<void> {
  await execute("DELETE FROM `password_resets` WHERE LOWER(`email`) = LOWER(?)", [email]);
}

export async function resetPasswordWithToken(token: string, newPasswordHash: string): Promise<{ success: boolean; error?: string }> {
  return await transaction(async (conn) => {
    const [rows] = await conn.query(
      "SELECT * FROM `password_resets` WHERE `token` = ? AND `usedAt` IS NULL AND `expiresAt` > ? LIMIT 1",
      [token, new Date()]
    );
    const reset = (rows as any[])[0];

    if (!reset) {
      return { success: false, error: "Invalid or expired reset token." };
    }

    const now = new Date();
    // Update user's password
    await conn.execute("UPDATE `users` SET `password` = ?, `updatedAt` = ? WHERE LOWER(`email`) = LOWER(?)", [
      newPasswordHash,
      now,
      reset.email,
    ]);

    // Mark reset token used
    await conn.execute("UPDATE `password_resets` SET `usedAt` = ? WHERE `id` = ?", [now, reset.id]);

    return { success: true };
  });
}
