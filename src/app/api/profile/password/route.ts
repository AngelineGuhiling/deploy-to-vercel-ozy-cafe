import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest, comparePassword, hashPassword } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [user.id]);
    const users = rows as Array<{ password: string }>;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await comparePassword(currentPassword, users[0].password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to change password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
