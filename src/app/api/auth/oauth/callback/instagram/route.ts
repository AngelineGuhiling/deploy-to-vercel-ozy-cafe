import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

    const clientId = process.env.FACEBOOK_CLIENT_ID!;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/auth/oauth/callback/instagram`;

    const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.json({ error: "Failed to get token" }, { status: 400 });

    const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
    const fbUser = await userRes.json();
    if (!fbUser.id) return NextResponse.json({ error: "Failed to get user info" }, { status: 400 });

    const email = fbUser.email || `${fbUser.id}@instagram.com`;
    const name = fbUser.name || "Instagram User";
    const avatar = fbUser.picture?.data?.url || null;

    const [existing]: any = await pool.query("SELECT id, name, email, role, avatar FROM users WHERE email = ?", [email]);
    let user: any;
    if (existing.length > 0) {
      user = existing[0];
      if (avatar && !user.avatar) {
        await pool.query("UPDATE users SET avatar = ? WHERE id = ?", [avatar, user.id]);
      }
    } else {
      const [result]: any = await pool.query("INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, 'customer', ?)", [name, email, "", avatar]);
      user = { id: result.insertId, name, email, role: "customer", avatar };
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}`);
    res.cookies.set("token", token, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 604800 });
    return res;
  } catch (error) {
    return NextResponse.json({ error: "Instagram OAuth failed" }, { status: 500 });
  }
}
