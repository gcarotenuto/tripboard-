import type { Metadata } from "next";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { UploadButton } from "@/components/vault/UploadButton";

export const metadata: Metadata = { title: "Document Vault" };

interface VaultPageProps {
  params: { id: string };
}

export default function VaultPage({ params }: VaultPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Document Vault</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Tickets, visas, vouchers — all your travel docs.
          </p>
        </div>
        <UploadButton tripId={params.id} />
      </div>

      {/* Ingest methods */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {[
          { label: "Email", emoji: "📧" },
          { label: "PDF", emoji: "📄" },
          { label: "Photo", emoji: "📸" },
          { label: "Calendar", emoji: "📅" },
          { label: "Manual", emoji: "✏️" },
        ].map((method) => (
          <button
            key={method.label}
            className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-zinc-300 bg-transparent p-3 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="text-xl">{method.emoji}</span>
            <span className="text-xs font-medium">{method.label}</span>
          </button>
        ))}
      </div>

      {/* Document grid */}
      <DocumentVault tripId={params.id} />
    </div>
  );
}
