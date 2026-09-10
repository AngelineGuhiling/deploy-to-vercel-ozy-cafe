import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Order id required" }, { status: 400 });

    if (user) {
      const [ownerRows] = await pool.query("SELECT created_by FROM orders WHERE id = ?", [id]);
      const ownerList = ownerRows as Array<{ created_by: number | null }>;
      const orderOwner = ownerList[0]?.created_by ?? null;
      const isOwnerOrStaff = orderOwner === user.id || (user.role !== "customer");
      if (!isOwnerOrStaff) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const [orderRows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    const orderList = orderRows as Array<Record<string, unknown>>;
    if (orderList.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = orderList[0];

    const [itemRows] = await pool.query(`
      SELECT mi.name as name, oi.quantity, oi.price
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `, [id]);

    return NextResponse.json({ order, items: itemRows });
  } catch {
    return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
  }
}
