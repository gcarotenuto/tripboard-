"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }

      if (body.data?.resetUrl) {
        setResetUrl(body.data.resetUrl);
      } else {
        setResetUrl("__sent__");
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
            <span className="text-2xl">✈️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-zinc-400">Enter your email to get a reset link</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6 space-y-4">
          {!resetUrl ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
              >
                {loading ? "Generating link..." : "Send reset link"}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="text-4xl">🔗</div>
              <p className="text-sm text-zinc-300">Reset link generated. Click below to set your new password:</p>
              <a
                href={resetUrl}
                className="block w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all text-center"
              >
                Set new password →
              </a>
              <p className="text-xs text-zinc-500">Link valid for 1 hour</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
