import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { code, order_total } = await request.json();
    if (!code) return NextResponse.json({ error: "Promo code is required" }, { status: 400 });

    const [rows]: any = await pool.query("SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE", [code.toUpperCase()]);
    if (rows.length === 0) return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });

    const promo = rows[0];
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
    }
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ error: "Promo code has reached max uses" }, { status: 400 });
    }
    if (order_total < Number(promo.min_order)) {
      return NextResponse.json({ error: `Minimum order of ₱${Number(promo.min_order).toFixed(2)} required` }, { status: 400 });
    }

    let discount = 0;
    if (promo.discount_type === "percentage") {
      discount = (order_total * Number(promo.discount_value)) / 100;
    } else {
      discount = Number(promo.discount_value);
    }
    discount = Math.min(discount, order_total);

    return NextResponse.json({
      valid: true,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
      discount_amount: discount,
      promo_id: promo.id,
      code: promo.code,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const [rows] = await pool.query("SELECT * FROM promo_codes ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await request.json();
    const { id, used_count } = body;
    await pool.query("UPDATE promo_codes SET used_count = ? WHERE id = ?", [used_count, id]);
    return NextResponse.json({ message: "Promo usage updated" });
  } catch {
    return NextResponse.json({ error: "Failed to update promo" }, { status: 500 });
  }
}
