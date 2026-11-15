import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@/lib/types";
import { findUserById } from "@/lib/repositories/user";

function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is missing in production environment variables.");
    }
    return "ceenai-dev-secret-key-min-32-chars";
  }
  return secret;
}

const CUSTOMER_COOKIE_NAME = "ceenai_customer_session";
const ADMIN_COOKIE_NAME = "ceenai_admin_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: SessionPayload, expiresIn = "7d"): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  if (decoded.role !== Role.CUSTOMER) {
    return null;
  }
  return decoded;
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  if (decoded.role !== Role.ADMIN && decoded.role !== Role.SUPER_ADMIN) {
    return null;
  }
  return decoded;
}

export async function requireCustomer(): Promise<SessionPayload> {
  const session = await getCustomerSession();
  if (!session) {
    throw new Error("UNAUTHORIZED_CUSTOMER");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await getCustomerSession();
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user || user.role !== Role.CUSTOMER) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    addresses: user.addresses,
    createdAt: user.createdAt,
  };
}

export { CUSTOMER_COOKIE_NAME, ADMIN_COOKIE_NAME };
