import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone, address } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    let existing;
    try {
      [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    } catch {
      return NextResponse.json({ error: "Database not connected. Please import database.sql in phpMyAdmin first." }, { status: 500 });
    }

    if ((existing as Array<{ id: number }>).length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const customerRole = "customer";

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, customerRole, phone || null, address || null]
    );

    const userId = (result as { insertId: number }).insertId;
    const token = generateToken({ id: userId, email, role: customerRole });

    const response = NextResponse.json({
      user: { id: userId, name, email, role: customerRole, phone: phone || null, address: address || null },
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
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
