"use client";

import { signOut } from "next-auth/react";

interface SettingsClientProps {
  user: { name: string | null; email: string | null };
}

const SECTION = "rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6";
const LABEL = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";
const INPUT_DISABLED = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed";

export function SettingsClient({ user }: SettingsClientProps) {
  return (
    <div className="space-y-6">
      {/* Profile section */}
      <section className={SECTION}>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Display name</label>
            <input
              type="text"
              defaultValue={user.name ?? ""}
              disabled
              className={INPUT_DISABLED}
            />
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
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">Profile editing coming soon.</p>
      </section>

      {/* Preferences */}
      <section className={SECTION}>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Preferences</h3>
        <div className="space-y-3">
          {[
            { label: "Default currency", value: "USD" },
            { label: "Timezone", value: "UTC" },
            { label: "Date format", value: "MM/DD/YYYY" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
              <span className="text-sm text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">{value}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">Preference customization coming soon.</p>
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
