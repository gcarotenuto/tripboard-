"use client";

import useSWR from "swr";
import type { Document } from "@tripboard/shared";
import { DOCUMENT_TYPE_EMOJIS, DOCUMENT_TYPE_LABELS, formatFileSize, formatDate } from "@tripboard/shared";
import { Badge, Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  PROCESSING: { label: "Processing", variant: "primary" },
  EXTRACTED: { label: "Extracted", variant: "success" },
  REVIEWED: { label: "Reviewed", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
};

export function DocumentVault({ tripId }: { tripId: string }) {
  const { data: documents, isLoading, error } = useSWR<Document[]>(
    `/api/trips/${tripId}/documents`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 text-center py-8">Failed to load documents.</p>
    );
  }

  if (!documents?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <div className="text-4xl mb-3">🗄️</div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Vault is empty</h3>
        <p className="mt-1 text-sm text-zinc-500">Upload documents or forward booking emails.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const status = STATUS_BADGE[doc.status] ?? STATUS_BADGE.PENDING;
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
          >
            <span className="text-2xl shrink-0">
              {DOCUMENT_TYPE_EMOJIS[doc.type] ?? "📄"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {doc.filename}
                </p>
                <Badge variant={status.variant} className="shrink-0">
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-zinc-500">
                  {DOCUMENT_TYPE_LABELS[doc.type] ?? "Document"}
                </span>
                <span className="text-xs text-zinc-400">·</span>
                <span className="text-xs text-zinc-400">{formatFileSize(doc.fileSize)}</span>
                <span className="text-xs text-zinc-400">·</span>
                <span className="text-xs text-zinc-400">{formatDate(doc.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
