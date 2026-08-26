import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const [rows] = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { id } = body;
    if (id) {
      await pool.query("UPDATE notifications SET is_read=TRUE WHERE id=?", [id]);
    } else {
      await pool.query("UPDATE notifications SET is_read=TRUE");
    }
    return NextResponse.json({ message: "Notification marked as read" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update notification";
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

    if (id) {
      await pool.query("DELETE FROM notifications WHERE id = ?", [id]);
    } else {
      await pool.query("DELETE FROM notifications");
    }
    return NextResponse.json({ message: "Notification(s) deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
