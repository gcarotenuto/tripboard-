import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { ThemeToggle } from "@/components/pwa/ThemeToggle";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };

  // Fetch fresh user data including preferences from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, preferences: true },
  });

  let preferences: Record<string, unknown> = {};
  try {
    preferences = JSON.parse(dbUser?.preferences ?? "{}");
  } catch {
    preferences = {};
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your account and preferences.</p>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 mb-6">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Theme</span>
          <ThemeToggle variant="icon" />
        </div>
      </div>

      <SettingsClient
        user={{
          name: dbUser?.name ?? null,
          email: dbUser?.email ?? null,
          preferences,
        }}
      />
    </div>
  );
}
