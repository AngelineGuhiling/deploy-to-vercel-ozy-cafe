import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "ozy-cafe-secret-key";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/token=([^;]+)/);
  if (!tokenMatch) return null;

  const decoded = verifyToken(tokenMatch[1]);
  if (!decoded) return null;

  const [rows] = await pool.query("SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?", [decoded.id]);
  const users = rows as Array<{ id: number; name: string; email: string; role: string; avatar: string | null; phone: string | null; address: string | null }>;
  return users[0] || null;
}
