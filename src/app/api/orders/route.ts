import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const [rows] = await pool.query(`
      SELECT o.*, u.name as staff_name, u.role as staff_role,
        GROUP_CONCAT(CONCAT(mi.name, ' x', oi.quantity) SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, items, payment_method, order_type, created_by, promo_code, discount, payment_ref, delivery_address, customer_phone } = body;

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const total = Math.max(0, subtotal - (Number(discount) || 0));

    const [orderResult] = await pool.query(
      "INSERT INTO orders (customer_name, total, payment_method, order_type, delivery_address, customer_phone, created_by, payment_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [customer_name || "Walk-in", total, payment_method || "cash", order_type || "dine-in", delivery_address || null, customer_phone || null, created_by || null, payment_ref || null]
    );

    const orderId = (orderResult as { insertId: number }).insertId;

    for (const item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.menu_item_id, item.quantity, item.price]
      );
    }

    if (promo_code) {
      const [promoRows]: any = await pool.query("SELECT id, used_count FROM promo_codes WHERE code = ?", [promo_code]);
      if (promoRows.length > 0) {
        await pool.query("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", [promoRows[0].id]);
      }
    }

    await pool.query(
      "INSERT INTO notifications (order_id, message, type) VALUES (?, ?, 'order')",
      [orderId, `New order #${orderId} from ${customer_name || "Walk-in"} — ₱${total.toFixed(2)}`]
    );

    return NextResponse.json({ id: orderId, message: "Order created" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { id, status, delivery_status } = body;
    const updateQuery = delivery_status ? "UPDATE orders SET delivery_status=? WHERE id=?" : "UPDATE orders SET status=? WHERE id=?";
    const updateParams = delivery_status ? [delivery_status, id] : [status, id];
    await pool.query(updateQuery, updateParams);
    return NextResponse.json({ message: "Order updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
