import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM inventory ORDER BY item_name ASC");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { item_name, quantity, unit, min_stock, cost_per_unit } = body;

    const [result] = await pool.query(
      "INSERT INTO inventory (item_name, quantity, unit, min_stock, cost_per_unit) VALUES (?, ?, ?, ?, ?)",
      [item_name, quantity, unit, min_stock || 0, cost_per_unit || 0]
    );

    return NextResponse.json({ id: (result as { insertId: number }).insertId, message: "Inventory item added" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add inventory item";
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
    const { id, item_name, quantity, unit, min_stock, cost_per_unit } = body;

    await pool.query(
      "UPDATE inventory SET item_name=?, quantity=?, unit=?, min_stock=?, cost_per_unit=? WHERE id=?",
      [item_name, quantity, unit, min_stock, cost_per_unit, id]
    );

    return NextResponse.json({ message: "Inventory updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update inventory";
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
    await pool.query("DELETE FROM inventory WHERE id=?", [id]);
    return NextResponse.json({ message: "Inventory item deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }
}
