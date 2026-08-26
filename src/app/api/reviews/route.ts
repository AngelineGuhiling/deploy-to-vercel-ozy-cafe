import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get("menu_item_id");
    const all = searchParams.get("all");

    let query = "SELECT r.*, u.name as user_name, mi.name as item_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN menu_items mi ON r.menu_item_id = mi.id";
    const params: string[] = [];

    if (all && user && user.role !== "customer") {
      // Admin/barista can see all reviews
    } else if (menuItemId) {
      query += " WHERE r.menu_item_id = ?";
      params.push(menuItemId);
    }

    query += " ORDER BY r.created_at DESC";
    if (!all) query += " LIMIT 10";

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { menu_item_id, rating, comment } = await request.json();
    if (!menu_item_id || !rating) {
      return NextResponse.json({ error: "Menu item ID and rating are required" }, { status: 400 });
    }
    await pool.query(
      "INSERT INTO reviews (menu_item_id, user_id, customer_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [menu_item_id, user.id, user.name, rating, comment || null]
    );
    return NextResponse.json({ message: "Review submitted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
    return NextResponse.json({ message: "Review deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
