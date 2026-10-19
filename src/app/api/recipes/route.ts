import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT mr.id, mr.menu_item_id, mr.quantity_per_serving,
        mi.name AS menu_item_name,
        inv.item_name, inv.unit
      FROM menu_recipes mr
      JOIN menu_items mi ON mi.id = mr.menu_item_id
      JOIN inventory inv ON inv.id = mr.inventory_item_id
      ORDER BY mi.name ASC, inv.item_name ASC
    `);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let conn: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { menu_item_id, recipes } = body;
    if (!menu_item_id || !Array.isArray(recipes)) {
      return NextResponse.json({ error: "menu_item_id and recipes array are required" }, { status: 400 });
    }

    const valid = recipes.filter(
      (r: { inventory_item_id: number; quantity_per_serving: number }) =>
        Number(r.inventory_item_id) > 0 && Number(r.quantity_per_serving) > 0
    );

    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query("DELETE FROM menu_recipes WHERE menu_item_id = ?", [menu_item_id]);
    for (const r of valid) {
      await conn.query(
        "INSERT INTO menu_recipes (menu_item_id, inventory_item_id, quantity_per_serving) VALUES (?, ?, ?)",
        [menu_item_id, r.inventory_item_id, r.quantity_per_serving]
      );
    }

    await conn.commit();
    return NextResponse.json({ message: "Recipe saved" });
  } catch {
    if (conn) {
      try { await conn.rollback(); } catch {}
    }
    return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const menu_item_id = searchParams.get("menu_item_id");
    if (!menu_item_id) {
      return NextResponse.json({ error: "menu_item_id is required" }, { status: 400 });
    }
    await pool.query("DELETE FROM menu_recipes WHERE menu_item_id = ?", [menu_item_id]);
    return NextResponse.json({ message: "Recipe removed" });
  } catch {
    return NextResponse.json({ error: "Failed to remove recipe" }, { status: 500 });
  }
}
