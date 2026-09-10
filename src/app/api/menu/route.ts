import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT mi.*, c.name as category, c.type
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      ORDER BY mi.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { name, description, price, category_id, image, is_available } = body;

    const [result] = await pool.query(
      "INSERT INTO menu_items (name, description, price, category_id, image, is_available) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, price, category_id || null, image || null, is_available !== false]
    );

    return NextResponse.json({ id: (result as { insertId: number }).insertId, message: "Menu item created" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create menu item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { id, name, description, price, category_id, image, is_available } = body;

    await pool.query(
      "UPDATE menu_items SET name=?, description=?, price=?, category_id=?, image=?, is_available=? WHERE id=?",
      [name, description, price, category_id || null, image || null, is_available, id]
    );

    return NextResponse.json({ message: "Menu item updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update menu item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { id, is_available } = body;

    await pool.query("UPDATE menu_items SET is_available=? WHERE id=?", [is_available !== false, id]);

    return NextResponse.json({ message: "Menu item availability updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update menu item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await pool.query("DELETE FROM menu_items WHERE id=?", [id]);
    return NextResponse.json({ message: "Menu item deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete menu item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
