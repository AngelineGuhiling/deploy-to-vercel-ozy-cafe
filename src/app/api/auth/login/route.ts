import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let rows;
    try {
      [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    } catch (dbError) {
      return NextResponse.json({ error: "Database not connected. Please import database.sql in phpMyAdmin first." }, { status: 500 });
    }

    const users = rows as Array<{ id: number; name: string; email: string; password: string; role: string; avatar: string | null; phone: string | null; address: string | null }>;

    if (users.length === 0) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 401 });
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
