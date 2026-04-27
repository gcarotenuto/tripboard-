"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const body = await res.json();

      if (!res.ok) { setError(body.error ?? "Something went wrong"); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return <p className="text-sm text-red-400 text-center">Invalid reset link.</p>;
  }

  return done ? (
    <div className="text-center space-y-2">
      <div className="text-4xl">✅</div>
      <p className="text-sm text-zinc-300">Password updated! Redirecting to login…</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-zinc-500 text-center">Resetting password for <span className="text-zinc-300">{email}</span></p>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">New password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="min 8 characters"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm password</label>
        <input
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="repeat password"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
            <span className="text-2xl">✈️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">New password</h1>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
          <Suspense fallback={<p className="text-sm text-zinc-400 text-center">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
