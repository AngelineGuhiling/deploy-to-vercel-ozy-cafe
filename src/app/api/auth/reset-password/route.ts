import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const [resets]: any = await pool.query(
      "SELECT * FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()",
      [token]
    );

    if (resets.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashed, resets[0].email]);
    await pool.query("UPDATE password_resets SET used = TRUE WHERE id = ?", [resets[0].id]);

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
