import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getIngredientUsage, deductIngredients, restoreIngredients } from "@/lib/inventory";
import type { PoolConnection } from "mysql2/promise";

const VALID_STATUSES = ["reserved", "pending", "served", "completed", "cancelled"];

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let conn: PoolConnection | null = null;
  try {
    const body = await request.json();
    const { customer_name, items, payment_method, order_type, created_by, promo_code, discount, payment_ref, delivery_address, customer_phone } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const total = Math.max(0, subtotal - (Number(discount) || 0));

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      "INSERT INTO orders (customer_name, total, status, payment_method, order_type, delivery_address, customer_phone, created_by, payment_ref) VALUES (?, ?, 'reserved', ?, ?, ?, ?, ?, ?)",
      [customer_name || "Walk-in", total, payment_method || "cash", order_type || "dine-in", delivery_address || null, customer_phone || null, created_by || null, payment_ref || null]
    );

    const orderId = (orderResult as { insertId: number }).insertId;

    for (const item of items) {
      await conn.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.menu_item_id, item.quantity, item.price]
      );
    }

    const usage = await getIngredientUsage(conn, items);
    const stockError = await deductIngredients(conn, usage);
    if (stockError) {
      await conn.rollback();
      return NextResponse.json({ error: stockError }, { status: 400 });
    }

    if (promo_code) {
      const [promoRows] = await conn.query("SELECT id, used_count FROM promo_codes WHERE code = ?", [promo_code]);
      const promo = (promoRows as { id: number }[])[0];
      if (promo) {
        await conn.query("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", [promo.id]);
      }
    }

    await conn.query(
      "INSERT INTO notifications (order_id, message, type) VALUES (?, ?, 'order')",
      [orderId, `New order #${orderId} from ${customer_name || "Walk-in"} — ₱${total.toFixed(2)}`]
    );

    await conn.commit();
    return NextResponse.json({ id: orderId, message: "Order placed — items reserved" });
  } catch {
    if (conn) {
      try { await conn.rollback(); } catch {}
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(request: Request) {
  let conn: PoolConnection | null = null;
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { id, status, delivery_status } = body;

    if (delivery_status) {
      await pool.query("UPDATE orders SET delivery_status=? WHERE id=?", [delivery_status, id]);
      return NextResponse.json({ message: "Order updated" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "cancelled") {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      const [orderRows] = await conn.query("SELECT status FROM orders WHERE id=? FOR UPDATE", [id]);
      const order = (orderRows as { status: string }[])[0];
      if (!order) {
        await conn.rollback();
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status !== "cancelled") {
        const [itemRows] = await conn.query("SELECT menu_item_id, quantity FROM order_items WHERE order_id=?", [id]);
        const usage = await getIngredientUsage(conn, itemRows as { menu_item_id: number; quantity: number }[]);
        await restoreIngredients(conn, usage);
      }

      await conn.query("UPDATE orders SET status=? WHERE id=?", [status, id]);
      await conn.commit();
      return NextResponse.json({ message: "Order cancelled — ingredients restored" });
    }

    await pool.query("UPDATE orders SET status=? WHERE id=?", [status, id]);
    return NextResponse.json({ message: "Order updated" });
  } catch {
    if (conn) {
      try { await conn.rollback(); } catch {}
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
