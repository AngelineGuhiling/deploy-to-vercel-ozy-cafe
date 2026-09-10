import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM settings LIMIT 1");
    return NextResponse.json((rows as Array<Record<string, unknown>>)[0] || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { shop_name, shop_address, shop_phone, shop_email, opening_hours, gcash_number, gcash_qr } = body;

    await pool.query(
      "UPDATE settings SET shop_name=?, shop_address=?, shop_phone=?, shop_email=?, opening_hours=?, gcash_number=?, gcash_qr=? WHERE id=1",
      [shop_name, shop_address, shop_phone, shop_email, opening_hours, gcash_number || null, gcash_qr || null]
    );

    return NextResponse.json({ message: "Settings updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
