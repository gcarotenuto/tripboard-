"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

interface SettingsClientProps {
  user: { name: string | null; email: string | null; preferences?: Record<string, unknown> };
}

const SECTION = "rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6";
const LABEL = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";
const INPUT = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400";
const INPUT_DISABLED = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF"];

export function SettingsClient({ user }: SettingsClientProps) {
  const { toast } = useToast();
  const [name, setName] = useState(user.name ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  const defaultCurrencyInit = (user.preferences?.defaultCurrency as string) ?? "USD";
  const [defaultCurrency, setDefaultCurrency] = useState(defaultCurrencyInit);
  const [currencySaved, setCurrencySaved] = useState(false);

  async function saveName() {
    if (!name.trim()) return;
    setNameSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("save failed");
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      toast("Failed to save name — please try again", "error");
    } finally {
      setNameSaving(false);
    }
  }

  async function saveCurrency(value: string) {
    setDefaultCurrency(value);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { defaultCurrency: value } }),
      });
      if (!res.ok) throw new Error("save failed");
      setCurrencySaved(true);
      setTimeout(() => setCurrencySaved(false), 2000);
    } catch {
      toast("Failed to save preference — please try again", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <section className={SECTION}>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Display name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT}
              />
              <button
                onClick={saveName}
                disabled={nameSaving}
                className="shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {nameSaved ? "Saved!" : nameSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input
              type="email"
              defaultValue={user.email ?? ""}
              disabled
              className={INPUT_DISABLED}
            />
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className={SECTION}>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Default currency</label>
            <div className="flex items-center gap-3">
              <select
                value={defaultCurrency}
                onChange={(e) => saveCurrency(e.target.value)}
                className={`${INPUT} max-w-[160px]`}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {currencySaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Saved!</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About / version */}
      <section className={SECTION}>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">About</h3>
        <div className="space-y-2">
          {[
            { label: "Version", value: "0.1.0 (MVP)" },
            { label: "Build", value: "Next.js 14 · Prisma · SQLite" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 p-6">
        <h3 className="text-base font-semibold text-red-700 dark:text-red-400 mb-3">Account</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sign out</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">You will be redirected to the login page.</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
