"use client";

import { useState } from "react";
import { mutate } from "swr";

interface Props {
  tripId: string;
  onClose: () => void;
}

interface ParseResult {
  documentType: string;
  confidence: number;
  eventsCreated: number;
  fields: Record<string, unknown>;
}

export function EmailParsePanel({ tripId, onClose }: Props) {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ingest/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, subject, body, tripId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Parsing failed");
        return;
      }

      const data = json.data as ParseResult;
      setResult(data);
      mutate(`/api/trips/${tripId}/documents`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const confidenceColor =
    confidencePct >= 90 ? "text-emerald-600 dark:text-emerald-400"
    : confidencePct >= 70 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="mt-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Parse email
        </p>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              From <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="noreply@airline.com"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your flight confirmation — BA 123 London to Rome"
              required
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Email body <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              required
              placeholder={"Dear Passenger,\n\nYour booking is confirmed.\nFlight: BA 123\nFrom: London Heathrow (LHR)\nTo: Rome Fiumicino (FCO)\nDeparture: 25 May 2026 08:30\nBooking ref: ABC123"}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 resize-none font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim() || !body.trim()}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              {loading ? "Parsing…" : "Parse email →"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {result.eventsCreated > 0 ? "✅" : "📄"}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {result.documentType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Document extracted</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500">Confidence:</span>
                <span className={`font-semibold ${confidenceColor}`}>{confidencePct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500">Events added:</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{result.eventsCreated}</span>
              </div>
            </div>

            {Object.keys(result.fields).length > 0 && (
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                  Extracted fields
                </p>
                <dl className="space-y-1">
                  {Object.entries(result.fields).slice(0, 6).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0 capitalize">
                        {k.replace(/([A-Z])/g, " $1").trim()}:
                      </dt>
                      <dd className="text-zinc-700 dark:text-zinc-300 truncate">
                        {String(v ?? "")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setResult(null); setSubject(""); setBody(""); setFrom(""); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Parse another
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
