import { NextResponse } from "next/server";
import pool from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFirstRow(rows: any) {
  const arr = rows as Record<string, unknown>[];
  return arr[0] || {};
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const [totalOrders] = await pool.query("SELECT COUNT(*) as count FROM orders");
    const [totalRevenue] = await pool.query("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status='completed'");
    const [totalProducts] = await pool.query("SELECT COUNT(*) as count FROM menu_items");
    const [todayOrders] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()"
    );

    const [topProducts] = await pool.query(`
      SELECT mi.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY mi.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    const [recentOrders] = await pool.query(`
      SELECT o.*, u.name as staff_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    const [dailyRevenue] = await pool.query(`
      SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    const totalOrdersRow = getFirstRow(totalOrders);
    const totalRevenueRow = getFirstRow(totalRevenue);
    const totalProductsRow = getFirstRow(totalProducts);
    const todayOrdersRow = getFirstRow(todayOrders);

    return NextResponse.json({
      stats: {
        totalOrders: (totalOrdersRow as { count: number }).count,
        totalRevenue: (totalRevenueRow as { total: number }).total,
        totalProducts: (totalProductsRow as { count: number }).count,
        todayOrders: (todayOrdersRow as { count: number }).count,
      },
      topProducts,
      recentOrders,
      dailyRevenue,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
