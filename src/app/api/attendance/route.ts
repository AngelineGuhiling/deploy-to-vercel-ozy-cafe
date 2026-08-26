import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const date = searchParams.get("date");

    let query = `
      SELECT a.*, u.name as user_name, u.role as user_role
      FROM attendance a
      JOIN users u ON a.user_id = u.id
    `;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (userId) {
      conditions.push("a.user_id = ?");
      params.push(parseInt(userId));
    } else if (user.role === "barista") {
      conditions.push("a.user_id = ?");
      params.push(user.id);
    }

    if (date) {
      conditions.push("DATE(a.check_in) = ?");
      params.push(date);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY a.check_in DESC";

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action, notes } = body;

    if (action === "check_in") {
      const today = new Date().toISOString().split("T")[0];
      const [existing] = await pool.query(
        "SELECT id FROM attendance WHERE user_id = ? AND DATE(check_in) = ?",
        [user.id, today]
      );

      if ((existing as Array<{ id: number }>).length > 0) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
      }

      const now = new Date();
      const hour = now.getHours();
      const status = hour >= 8 ? "late" : "present";

      const [result] = await pool.query(
        "INSERT INTO attendance (user_id, check_in, status, notes) VALUES (?, ?, ?, ?)",
        [user.id, now, status, notes || null]
      );

      return NextResponse.json({
        id: (result as { insertId: number }).insertId,
        message: status === "late" ? "Checked in (late)" : "Checked in successfully",
        status,
      });
    }

    if (action === "check_out") {
      const today = new Date().toISOString().split("T")[0];
      const [rows] = await pool.query(
        "SELECT id, check_in FROM attendance WHERE user_id = ? AND DATE(check_in) = ? AND check_out IS NULL",
        [user.id, today]
      );

      const records = rows as Array<{ id: number; check_in: Date }>;
      if (records.length === 0) {
        return NextResponse.json({ error: "No active check-in found for today" }, { status: 400 });
      }

      await pool.query(
        "UPDATE attendance SET check_out = NOW() WHERE id = ?",
        [records[0].id]
      );

      return NextResponse.json({ message: "Checked out successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record attendance";
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
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await pool.query("DELETE FROM attendance WHERE id = ?", [id]);
    return NextResponse.json({ message: "Record deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
