import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackingView } from "@/components/packing/PackingView";
import { AiPackingButton } from "@/components/packing/AiPackingButton";

interface PackingPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PackingPageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "Packing List" };
  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    select: { title: true },
  });
  return { title: trip ? `${trip.title} — Packing` : "Packing List" };
}

export default function PackingPage({ params }: PackingPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🧳 Packing List
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Track everything you need to bring on your trip.
          </p>
        </div>
        <AiPackingButton tripId={params.id} />
      </div>

      <PackingView tripId={params.id} />
    </div>
  );
}
