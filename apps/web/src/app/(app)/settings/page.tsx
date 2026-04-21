import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your account and preferences.</p>
      </div>

      <SettingsClient user={{ name: user.name ?? null, email: user.email ?? null }} />
    </div>
  );
}
