import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TripMap } from "@/components/map/TripMap";

interface MapPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: MapPageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "Trip Map" };
  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    select: { title: true },
  });
  return { title: trip ? `${trip.title} — Map` : "Trip Map" };
}

export default function TripMapPage({ params }: MapPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          🗺️ Trip Map
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          All your trip locations on an interactive map.
        </p>
      </div>
      <TripMap tripId={params.id} />
    </div>
  );
}
