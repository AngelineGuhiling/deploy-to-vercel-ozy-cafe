"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reset password"); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-2xl">
        <p className="text-red-500 font-medium">Invalid reset link. No token provided.</p>
        <Link href="/forgot-password" className="inline-block mt-4 text-coffee-accent hover:underline">Request a new one</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/beans.jpg')" }}></div>
      <div className="absolute inset-0 bg-coffee-dark/70"></div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/"><img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg" /></Link>
          <h1 className="text-3xl font-bold text-coffee-dark">Reset Password</h1>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-coffee-dark font-medium">Password reset successfully!</p>
            <p className="text-coffee-primary/70 text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-2">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-2">Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-coffee-primary text-coffee-cream py-3 rounded-xl font-semibold hover:bg-coffee-dark transition disabled:opacity-50">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-coffee-accent border-t-transparent rounded-full animate-spin"></div></div>}>
      <ResetForm />
    </Suspense>
  );
}
