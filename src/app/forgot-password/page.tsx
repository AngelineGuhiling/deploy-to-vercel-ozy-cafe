"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setSent(true);
      setResetLink(data.reset_link || "");
    } catch {
      setError("Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/beans.jpg')" }}></div>
      <div className="absolute inset-0 bg-coffee-dark/70"></div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/"><img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg cursor-pointer hover:opacity-80 transition" /></Link>
          <h1 className="text-3xl font-bold text-coffee-dark">Forgot Password</h1>
          <p className="text-coffee-primary/70 mt-2">Enter your email to reset your password</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <p className="text-coffee-dark font-medium">Check your email for the reset link.</p>
            {resetLink && (
              <div className="bg-coffee-cream rounded-xl p-4 text-sm">
                <p className="text-coffee-primary/70 mb-2">(Dev mode) Reset link:</p>
                <a href={resetLink} className="text-coffee-accent font-medium break-all hover:underline">{resetLink}</a>
              </div>
            )}
            <Link href="/login" className="inline-block text-coffee-accent font-medium hover:underline">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-coffee-primary text-coffee-cream py-3 rounded-xl font-semibold hover:bg-coffee-dark transition disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-coffee-primary/70">
              Remember your password?{" "}
              <Link href="/login" className="text-coffee-accent font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
