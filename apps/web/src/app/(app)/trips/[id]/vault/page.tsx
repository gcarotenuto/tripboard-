import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { UploadButton } from "@/components/vault/UploadButton";
import { VaultImportMethods } from "@/components/vault/VaultImportMethods";

interface VaultPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: VaultPageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "Document Vault" };
  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    select: { title: true },
  });
  return { title: trip ? `${trip.title} — Vault` : "Document Vault" };
}

export default function VaultPage({ params }: VaultPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Document Vault</h2>
          <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500 max-w-sm">
            Confirmations, visas, tickets, and receipts — extracted and always with you.
          </p>
        </div>
        <UploadButton tripId={params.id} />
      </div>

      {/* Import methods — interactive client component */}
      <VaultImportMethods tripId={params.id} />

      {/* Document list */}
      <DocumentVault tripId={params.id} />
    </div>
  );
}
