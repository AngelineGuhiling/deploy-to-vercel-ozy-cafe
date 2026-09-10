import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { generateToken } from "@/lib/auth";

interface DBUser extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    if (oauthError) return NextResponse.json({ error: `Google OAuth error: ${oauthError}` }, { status: 400 });
    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/auth/oauth/callback/google`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.json({ error: "Failed to get token" }, { status: 400 });

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.id) return NextResponse.json({ error: "Failed to get user info" }, { status: 400 });

    const email = googleUser.email || `${googleUser.id}@gmail.com`;
    const name = googleUser.name || "Google User";
    const avatar = googleUser.picture || null;

    const [existing] = await pool.query<DBUser[]>("SELECT id, name, email, role, avatar FROM users WHERE email = ?", [email]);
    let user: DBUser | { id: number; name: string; email: string; role: string; avatar: string | null };
    if (existing.length > 0) {
      user = existing[0];
      if (avatar && !user.avatar) {
        await pool.query("UPDATE users SET avatar = ? WHERE id = ?", [avatar, user.id]);
      }
    } else {
      const [result] = await pool.query<ResultSetHeader>("INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, 'customer', ?)", [name, email, "", avatar]);
      user = { id: result.insertId, name, email, role: "customer", avatar };
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}`);
    res.cookies.set("token", token, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 604800 });
    return res;
  } catch {
    return NextResponse.json({ error: "Google OAuth failed" }, { status: 500 });
  }
}