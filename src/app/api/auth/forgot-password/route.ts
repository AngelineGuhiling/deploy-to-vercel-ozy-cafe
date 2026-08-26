import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const [users]: any = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
      [email, token, expiresAt]
    );

    const resetLink = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    // In production, send email here with the reset link.
    // For development, return the link directly.
    console.log("Password reset link:", resetLink);

    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
      reset_link: resetLink,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
