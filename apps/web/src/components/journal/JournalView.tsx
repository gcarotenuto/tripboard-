"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { Trash2, Pencil, X, AlertTriangle } from "lucide-react";
import type { JournalEntry } from "@tripboard/shared";
import { formatDate } from "@tripboard/shared";
import { useToast } from "@/components/ui/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface EditForm {
  title: string;
  content: string;
  mood: string;
}

const MOOD_OPTIONS = ["😊", "😄", "🥰", "😎", "🤩", "😌", "😐", "😴", "😤", "😢", "🤯", "🎉", "✈️", "🌟", "📝"];

function JournalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-start gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-4/5 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-3/5 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JournalView({ tripId }: { tripId: string }) {
  const { data: entries, isLoading, mutate } = useSWR<JournalEntry[]>(
    `/api/trips/${tripId}/journal`,
    fetcher
  );
  const { toast } = useToast();

  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState<EditForm>({ title: "", content: "", mood: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function openEdit(entry: JournalEntry) {
    setEditingEntry(entry);
    setForm({
      title: entry.title ?? "",
      content: entry.content ?? "",
      mood: entry.mood ?? "",
    });
  }

  function closeEdit() {
    setEditingEntry(null);
  }

  // ESC to close edit modal
  useEffect(() => {
    if (!editingEntry) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeEdit(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editingEntry]);

  async function handleDelete(entry: JournalEntry) {
    setDeletingId(null);
    try {
      await fetch(`/api/trips/${tripId}/journal/${entry.id}`, { method: "DELETE" });
      mutate();
      globalMutate(`/api/trips/${tripId}/stats`);
      toast("Entry deleted");
    } catch {
      toast("Failed to delete entry", "error");
    }
  }

  async function handleSave() {
    if (!editingEntry) return;
    if (!form.content.trim()) {
      toast("Content can't be empty", "error");
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/trips/${tripId}/journal/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title || null,
          content: form.content,
          mood: form.mood || null,
        }),
      });
      closeEdit();
      mutate();
      toast("Entry saved");
    } catch {
      toast("Failed to save entry", "error");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <JournalSkeleton />;

  if (!entries?.length) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
        {/* Gradient hero */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-pink-50/30 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/10 px-8 py-7 text-center">
          <div className="text-5xl mb-3">📓</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Your travel diary starts here</h3>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Write about your day, capture a mood, or just jot a quick note. Every entry becomes part of your Memory Capsule.
          </p>
        </div>

        {/* Writing prompts */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Inspiration to get started</p>
          <div className="space-y-2">
            {[
              { emoji: "🌅", text: "What was the best moment today?" },
              { emoji: "🍜", text: "Describe the food you tried." },
              { emoji: "💡", text: "What surprised you most so far?" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 italic">
                <span className="shrink-0">{emoji}</span>
                <span>&ldquo;{text}&rdquo;</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Tap <strong className="text-zinc-600 dark:text-zinc-300">+ Add Entry</strong> above to write your first entry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="group rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xl">{entry.mood ?? "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-400">{formatDate(entry.entryDate)}</p>
                {entry.title && (
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.title}</h3>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {deletingId === entry.id ? (
                  /* Inline confirmation */
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2.5 py-1">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">Delete?</span>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    >
                      Yes
                    </button>
                    <span className="text-red-300 dark:text-red-800">·</span>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(entry)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                      title="Edit entry"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingId(entry.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {(() => {
              const isLong = entry.content.length > 400;
              const isExpanded = expandedIds.has(entry.id);
              return (
                <>
                  <p className={`text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap ${isLong && !isExpanded ? "line-clamp-4" : ""}`}>
                    {entry.content}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => setExpandedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id);
                        return next;
                      })}
                      className="mt-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </>
              );
            })()}
            {entry.locationName && (
              <p className="mt-3 text-xs text-zinc-400">📍 {entry.locationName}</p>
            )}
          </article>
        ))}
      </div>

      {/* Edit modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Edit Journal Entry</h2>
              <button onClick={closeEdit} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-500">Content <span className="text-red-400">*</span></label>
                  {form.content.trim() && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {form.content.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </div>
                <textarea
                  rows={6}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="What happened today…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Mood</label>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, mood: form.mood === emoji ? "" : emoji })}
                      className={`text-xl leading-none p-1.5 rounded-lg border transition-all ${
                        form.mood === emoji
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-110"
                          : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEdit}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.content.trim()}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
