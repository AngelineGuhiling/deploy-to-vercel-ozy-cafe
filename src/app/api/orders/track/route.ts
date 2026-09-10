import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, lat, lng } = body;

    if (!id || lat == null || lng == null) {
      return NextResponse.json({ error: "id, lat and lng are required" }, { status: 400 });
    }

    const numberLat = Number(lat);
    const numberLng = Number(lng);
    if (Number.isNaN(numberLat) || Number.isNaN(numberLng)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    await pool.query("UPDATE orders SET driver_lat = ?, driver_lng = ? WHERE id = ?", [numberLat, numberLng, id]);

    return NextResponse.json({ message: "Location updated" });
  } catch {
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Order id required" }, { status: 400 });

    if (user) {
      const [ownerRows] = await pool.query("SELECT created_by FROM orders WHERE id = ?", [id]);
      const ownerList = ownerRows as Array<{ created_by: number | null }>;
      const orderOwner = ownerList[0]?.created_by ?? null;
      const isOwnerOrStaff = orderOwner === user.id || user.role !== "customer";
      if (!isOwnerOrStaff) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const [rows] = await pool.query(
      "SELECT driver_lat, driver_lng, delivery_status, order_type, delivery_address FROM orders WHERE id = ?",
      [id]
    );
    const list = rows as Array<Record<string, unknown>>;
    if (list.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(list[0]);
  } catch {
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 });
  }
}