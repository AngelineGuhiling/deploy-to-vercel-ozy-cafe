import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { code, discount_type, discount_value, min_order, max_uses, expires_at } = await request.json();
    if (!code || !discount_value) return NextResponse.json({ error: "Code and value required" }, { status: 400 });
    await pool.query(
      "INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      [code, discount_type || "percentage", discount_value, min_order || 0, max_uses || null, expires_at || null]
    );
    return NextResponse.json({ message: "Promo created" });
  } catch {
    return NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
  }
}
