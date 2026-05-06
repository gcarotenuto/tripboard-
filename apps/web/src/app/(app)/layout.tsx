import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileNav } from "@/components/nav/MobileNav";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import type { DateFormatPref } from "@tripboard/shared";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Load user preferences server-side so the provider has them immediately (no flash)
  let initialPreferences: { defaultCurrency?: string; dateFormat?: DateFormatPref } = {};
  try {
    const userId = (session.user as { id: string }).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    if (user?.preferences) {
      const parsed = JSON.parse(user.preferences) as Record<string, unknown>;
      initialPreferences = {
        defaultCurrency: typeof parsed.defaultCurrency === "string" ? parsed.defaultCurrency : undefined,
        dateFormat: (["MDY", "DMY", "YMD"] as DateFormatPref[]).includes(parsed.dateFormat as DateFormatPref)
          ? (parsed.dateFormat as DateFormatPref)
          : undefined,
      };
    }
  } catch {
    // fall back to defaults
  }

  return (
    <UserPreferencesProvider initialPreferences={initialPreferences}>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />

        {/* Floating action button — context-aware quick add on trip sub-pages */}
        <FloatingActionButton />
      </div>
    </UserPreferencesProvider>
  );
}
