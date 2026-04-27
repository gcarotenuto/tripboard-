"use client";

import useSWR from "swr";
import type { Document } from "@tripboard/shared";
import { DOCUMENT_TYPE_EMOJIS, DOCUMENT_TYPE_LABELS, formatFileSize, formatDate } from "@tripboard/shared";
import { Badge } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" }> = {
  PENDING:    { label: "Queued",      variant: "warning" },
  PROCESSING: { label: "Extracting…", variant: "primary" },
  STORED:     { label: "Stored",      variant: "default" },
  EXTRACTED:  { label: "Extracted",   variant: "success" },
  REVIEWED:   { label: "Verified",    variant: "success" },
  FAILED:     { label: "Failed",      variant: "danger" },
};

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  EMAIL_FORWARD: { label: "Email forward", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400" },
  PDF_UPLOAD:    { label: "PDF upload",    color: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" },
  IMAGE_UPLOAD:  { label: "Image upload",  color: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400" },
  MANUAL:        { label: "Manual entry",  color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  ICS_IMPORT:    { label: ".ics import",   color: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400" },
};

function ConfidencePill({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  const label = pct >= 90 ? "High confidence" : pct >= 70 ? "Review recommended" : "Needs review";

  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${pct}%`}>
      <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{pct}%</span>
    </div>
  );
}

function isReadyToday(doc: Document): boolean {
  if (!doc.extractedData) return false;
  try {
    const data = JSON.parse(doc.extractedData as unknown as string);
    const today = new Date().toISOString().split("T")[0];
    const checkFields = ["checkIn", "departureDate", "date", "startsAt"];
    return checkFields.some((f) => {
      const val = data[f];
      return val && String(val).startsWith(today);
    });
  } catch {
    return false;
  }
}

export function DocumentVault({ tripId }: { tripId: string }) {
  const { data: documents, isLoading, error } = useSWR<Document[]>(
    `/api/trips/${tripId}/documents`,
    fetcher
  );

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <p className="text-sm text-red-500 text-center py-8">Failed to load documents.</p>
  );

  if (!documents?.length) return (
    <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
      {/* Hero */}
      <div className="bg-gradient-to-br from-zinc-50 to-slate-50/80 dark:from-zinc-900 dark:to-zinc-800/50 px-8 py-7 text-center">
        <div className="text-5xl mb-3">🗄️</div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Vault is empty</h3>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Use the import panel above — TripBoard will extract and organise everything automatically.
        </p>
      </div>

      {/* Document type preview pills */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Supported document types</p>
        <div className="flex flex-wrap gap-2">
          {[
            { emoji: "✈️", label: "Flight tickets" },
            { emoji: "🏨", label: "Hotel bookings" },
            { emoji: "🚂", label: "Train passes" },
            { emoji: "🎫", label: "Event tickets" },
            { emoji: "🪪", label: "Visas & ID" },
            { emoji: "🚗", label: "Car rentals" },
            { emoji: "🧾", label: "Receipts" },
            { emoji: "📋", label: "Insurance" },
          ].map(({ emoji, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
          <span>🔒</span>
          <span>Documents are parsed privately — we never scan your inbox automatically.</span>
        </p>
      </div>
    </div>
  );

  const readyToday = documents.filter(isReadyToday);
  const needsReview = documents.filter(
    (d) => d.extractionConfidence !== null && (d.extractionConfidence as unknown as number) < 0.7 && d.status !== "FAILED"
  );
  const rest = documents.filter((d) => !readyToday.includes(d) && !needsReview.includes(d));

  return (
    <div className="space-y-6">
      {/* Ready Today bundle */}
      {readyToday.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📦</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Ready Today</h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">— documents relevant for today</span>
          </div>
          <div className="space-y-2">
            {readyToday.map((doc) => <DocumentRow key={doc.id} doc={doc} highlight />)}
          </div>
        </section>
      )}

      {/* Needs review */}
      {needsReview.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚠️</span>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Needs Review</h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">— low extraction confidence</span>
          </div>
          <div className="space-y-2">
            {needsReview.map((doc) => <DocumentRow key={doc.id} doc={doc} warn />)}
          </div>
        </section>
      )}

      {/* All documents */}
      {rest.length > 0 && (
        <section>
          {(readyToday.length > 0 || needsReview.length > 0) && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              All Documents
            </h3>
          )}
          <div className="space-y-2">
            {rest.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  highlight,
  warn,
}: {
  doc: Document;
  highlight?: boolean;
  warn?: boolean;
}) {
  const status = STATUS_BADGE[doc.status] ?? STATUS_BADGE.PENDING;
  const sourceInfo = SOURCE_LABEL[doc.source ?? "MANUAL"] ?? SOURCE_LABEL.MANUAL;
  const confidence = doc.extractionConfidence as unknown as number | null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
        highlight
          ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20"
          : warn
          ? "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10"
          : "border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-indigo-200 dark:hover:border-indigo-800"
      }`}
    >
      {/* Type emoji */}
      <span className="text-2xl shrink-0">
        {DOCUMENT_TYPE_EMOJIS[doc.type] ?? "📄"}
      </span>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {doc.filename}
          </p>
          <Badge variant={status.variant} className="shrink-0 text-xs">
            {status.label}
          </Badge>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {DOCUMENT_TYPE_LABELS[doc.type] ?? "Document"}
          </span>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${sourceInfo.color}`}>
            {sourceInfo.label}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatFileSize(doc.fileSize)}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(doc.createdAt)}</span>
        </div>

        {/* Confidence bar */}
        {confidence !== null && doc.status === "EXTRACTED" && (
          <div className="mt-2">
            <ConfidencePill confidence={confidence} />
          </div>
        )}
      </div>
    </div>
  );
}
