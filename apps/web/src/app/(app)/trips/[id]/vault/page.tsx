import type { Metadata } from "next";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { UploadButton } from "@/components/vault/UploadButton";

export const metadata: Metadata = { title: "Document Vault" };

interface VaultPageProps {
  params: { id: string };
}

const IMPORT_METHODS = [
  {
    label: "Forward email",
    icon: "📧",
    hint: "Send to vault@tripboard.app",
    color: "hover:border-blue-300 hover:bg-blue-50/60 dark:hover:border-blue-700 dark:hover:bg-blue-950/20",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    label: "Upload PDF",
    icon: "📄",
    hint: "Booking confirmation, voucher",
    color: "hover:border-violet-300 hover:bg-violet-50/60 dark:hover:border-violet-700 dark:hover:bg-violet-950/20",
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    label: "Scan / photo",
    icon: "📸",
    hint: "Printed tickets, visas",
    color: "hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    label: "Manual entry",
    icon: "✏️",
    hint: "Type details directly",
    color: "hover:border-amber-300 hover:bg-amber-50/60 dark:hover:border-amber-700 dark:hover:bg-amber-950/20",
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

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

      {/* Import methods */}
      <div className="mb-8 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
          Add Documents
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {IMPORT_METHODS.map((method) => (
            <button
              key={method.label}
              className={`flex flex-col gap-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-3.5 text-left transition-all ${method.color} group`}
            >
              <div className={`h-8 w-8 rounded-lg ${method.iconBg} flex items-center justify-center text-lg`}>
                {method.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {method.label}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600 leading-tight mt-0.5">
                  {method.hint}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
          <span>🔒</span>
          <span>Documents parsed privately. We never scan your inbox automatically.</span>
        </div>
      </div>

      {/* Document list */}
      <DocumentVault tripId={params.id} />
    </div>
  );
}
