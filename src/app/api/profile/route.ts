import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, avatar } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, user.id]
    );
    if ((existing as Array<{ id: number }>).length > 0) {
      return NextResponse.json({ error: "This email is already used by another account" }, { status: 400 });
    }

    await pool.query(
      "UPDATE users SET name=?, email=?, phone=?, address=?, avatar=? WHERE id=?",
      [name, email, phone || null, address || null, avatar || null, user.id]
    );

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
