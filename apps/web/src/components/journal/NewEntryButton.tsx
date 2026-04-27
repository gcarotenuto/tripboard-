"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Modal } from "@tripboard/ui";
import { MOOD_OPTIONS } from "@tripboard/shared";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function NewEntryButton({ tripId }: { tripId: string }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiWrite = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/journal/ai-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          mood,
          title,
        }),
      });
      const json = await res.json() as { content?: string };
      if (json.content) setContent(json.content);
      else toast("Couldn't generate AI entry — try again", "error");
    } catch {
      toast("Couldn't generate AI entry — try again", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast("Write something before saving", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content,
          mood,
          entryDate: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) throw new Error("save failed");
      await mutate(`/api/trips/${tripId}/journal`);
      mutate(`/api/trips/${tripId}/stats`);
      toast("Journal entry saved 📓");
      setTitle("");
      setContent("");
      setMood("");
      setIsOpen(false);
    } catch {
      toast("Failed to save entry — try again", "error");
    } finally {
      setSaving(false);
    }
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
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Title <span className="text-zinc-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First day in Lisbon"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                What happened today?
              </label>
              <button
                type="button"
                onClick={handleAiWrite}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {aiLoading ? "Writing…" : "✨ AI write"}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder={aiLoading ? "AI is writing your entry…" : "Write your travel story, or let AI draft it for you…"}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            {content.trim() && (
              <p className="mt-1 text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                {content.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            )}
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
