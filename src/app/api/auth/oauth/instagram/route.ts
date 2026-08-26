import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Instagram login uses Facebook Login. Set FACEBOOK_CLIENT_ID in .env.local" }, { status: 501 });
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/auth/oauth/callback/facebook`;
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile&response_type=code`;
  return NextResponse.redirect(url);
}
