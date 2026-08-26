import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }
    await pool.query(
      "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
      [name, email, subject || null, message]
    );

    await pool.query(
      "INSERT INTO notifications (message, type) VALUES (?, 'contact')",
      [`New message from ${name}${subject ? ` — ${subject}` : ""}`]
    );

    return NextResponse.json({ message: "Message sent successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
