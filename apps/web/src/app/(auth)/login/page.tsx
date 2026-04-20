import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
            <span className="text-2xl">✈️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">TripBoard</h1>
          <p className="mt-1 text-sm text-zinc-400">Your private travel operating system</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Your data is yours. We never scan your inbox.
        </p>
      </div>
    </div>
  );
}
