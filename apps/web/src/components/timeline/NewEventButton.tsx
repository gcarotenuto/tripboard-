"use client";

import { useState } from "react";
import { mutate } from "swr";
import type { EventType } from "@tripboard/shared";
import { EVENT_TYPE_EMOJIS, EVENT_TYPE_LABELS, LOGISTICS_EVENT_TYPES, MOMENTS_EVENT_TYPES } from "@tripboard/shared";

const ALL_TYPES = [...LOGISTICS_EVENT_TYPES, ...MOMENTS_EVENT_TYPES];

interface NewEventButtonProps {
  tripId: string;
  defaultView?: "logistics" | "moments";
}

export function NewEventButton({ tripId, defaultView = "logistics" }: NewEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: (defaultView === "logistics" ? "FLIGHT" : "ACTIVITY") as EventType,
    date: "",
    time: "",
    locationName: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);

    let startsAt: string | undefined;
    if (form.date) {
      startsAt = form.time
        ? new Date(`${form.date}T${form.time}`).toISOString()
        : new Date(form.date).toISOString();
    }

    await fetch(`/api/trips/${tripId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        startsAt,
        locationName: form.locationName || undefined,
        notes: form.notes || undefined,
      }),
    });

    await mutate(`/api/trips/${tripId}/events?view=LOGISTICS`);
    await mutate(`/api/trips/${tripId}/events?view=MOMENTS`);
    await mutate(`/api/trips/${tripId}/stats`);

    setForm({ title: "", type: defaultView === "logistics" ? "FLIGHT" : "ACTIVITY", date: "", time: "", locationName: "", notes: "" });
    setLoading(false);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all"
      >
        + Add Event
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Event</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Title *</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Tokyo Skytree visit"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      title={EVENT_TYPE_LABELS[t]}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 px-1 transition-colors ${
                        form.type === t
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-base">{EVENT_TYPE_EMOJIS[t]}</span>
                      <span className="leading-tight text-center" style={{ fontSize: "9px" }}>
                        {EVENT_TYPE_LABELS[t].split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Location <span className="text-zinc-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Skytree Tower, Tokyo"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Notes <span className="text-zinc-400 font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Any extra details..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.title.trim()}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all mt-2"
              >
                {loading ? "Adding…" : "Add to Timeline 📅"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
