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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create promo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { id, code, discount_type, discount_value, min_order, max_uses, expires_at, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    if (is_active !== undefined) {
      await pool.query("UPDATE promo_codes SET is_active=? WHERE id=?", [is_active, id]);
    } else {
      await pool.query(
        "UPDATE promo_codes SET code=?, discount_type=?, discount_value=?, min_order=?, max_uses=?, expires_at=? WHERE id=?",
        [code, discount_type, discount_value, min_order || 0, max_uses || null, expires_at || null, id]
      );
    }
    return NextResponse.json({ message: "Promo updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update promo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await pool.query("DELETE FROM promo_codes WHERE id=?", [id]);
    return NextResponse.json({ message: "Promo deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete promo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
