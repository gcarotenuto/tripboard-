import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JournalView } from "@/components/journal/JournalView";
import { NewEntryButton } from "@/components/journal/NewEntryButton";

interface JournalPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: JournalPageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "Journal" };
  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    select: { title: true },
  });
  return { title: trip ? `${trip.title} — Journal` : "Journal" };
}

export default function JournalPage({ params }: JournalPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Journal</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Your private travel story.
          </p>
        </div>
        <NewEntryButton tripId={params.id} />
      </div>

      {/* Journal entries */}
      <JournalView tripId={params.id} />
    </div>
  );
}
