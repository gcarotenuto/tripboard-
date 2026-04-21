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
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Every confirmation, visa, ticket, and receipt — extracted, organized, and always with you.
          </p>
        </div>
        <UploadButton tripId={params.id} />
      </div>

      {/* Import methods */}
      <div className="mb-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
          Add Documents
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Forward email", emoji: "📧", hint: "Send to your TripBoard address" },
            { label: "Upload PDF", emoji: "📄", hint: "Booking confirmation, voucher" },
            { label: "Scan / photo", emoji: "📸", hint: "Printed tickets, visas" },
            { label: "Manual entry", emoji: "✏️", hint: "Type details directly" },
          ].map((method) => (
            <button
              key={method.label}
              className="flex flex-col items-start gap-1 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-transparent p-3 text-left hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/20 transition-colors group"
            >
              <span className="text-xl">{method.emoji}</span>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                {method.label}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight">
                {method.hint}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          🔒 All documents are parsed on your behalf and stored privately. We never scan your inbox.
        </p>
      </div>

      {/* Document list with intelligence layer */}
      <DocumentVault tripId={params.id} />
    </div>
  );
}
