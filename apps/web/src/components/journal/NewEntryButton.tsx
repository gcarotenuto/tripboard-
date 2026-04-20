"use client";

import { useState } from "react";
import { Modal } from "@tripboard/ui";
import { MOOD_OPTIONS } from "@tripboard/shared";

export function NewEntryButton({ tripId }: { tripId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    await fetch(`/api/trips/${tripId}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        mood,
        entryDate: new Date().toISOString().split("T")[0],
      }),
    });

    setContent("");
    setMood("");
    setSaving(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all"
      >
        + New Entry
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Journal Entry" size="lg">
        <div className="space-y-4">
          {/* Mood picker */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.emoji}
                  onClick={() => setMood(mood === m.emoji ? "" : m.emoji)}
                  title={m.label}
                  className={`rounded-lg p-2 text-xl transition-all ${
                    mood === m.emoji
                      ? "bg-indigo-100 ring-2 ring-indigo-400 dark:bg-indigo-900"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
              What happened today?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Write your travel story..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
            >
              {saving ? "Saving..." : "Save entry"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
