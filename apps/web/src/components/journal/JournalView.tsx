"use client";

import { useState } from "react";
import useSWR from "swr";
import { Trash2, Pencil, X } from "lucide-react";
import type { JournalEntry } from "@tripboard/shared";
import { formatDate } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface EditForm {
  title: string;
  content: string;
  mood: string;
}

export function JournalView({ tripId }: { tripId: string }) {
  const { data: entries, isLoading, mutate } = useSWR<JournalEntry[]>(
    `/api/trips/${tripId}/journal`,
    fetcher
  );

  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState<EditForm>({ title: "", content: "", mood: "" });
  const [saving, setSaving] = useState(false);

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

  async function handleDelete(entry: JournalEntry) {
    if (!window.confirm("Delete this journal entry?")) return;
    await fetch(`/api/trips/${tripId}/journal/${entry.id}`, { method: "DELETE" });
    mutate();
  }

  async function handleSave() {
    if (!editingEntry) return;
    setSaving(true);
    await fetch(`/api/trips/${tripId}/journal/${editingEntry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title || null,
        content: form.content,
        mood: form.mood || null,
      }),
    });
    setSaving(false);
    closeEdit();
    mutate();
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  if (!entries?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <div className="text-4xl mb-3">📓</div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No journal entries yet</h3>
        <p className="mt-1 text-sm text-zinc-500">Write your first entry to start capturing memories.</p>
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
                <button
                  onClick={() => openEdit(entry)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                  title="Edit entry"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {entry.content}
            </p>
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
                <label className="block text-xs font-medium text-zinc-500 mb-1">Content</label>
                <textarea
                  rows={6}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Mood (emoji)</label>
                <input
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                  placeholder="e.g. 😊"
                />
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
                disabled={saving}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
