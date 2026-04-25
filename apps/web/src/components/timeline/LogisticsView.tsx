"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Trash2, Pencil, X, Search, AlertTriangle } from "lucide-react";
import type { TripEvent, EventType } from "@tripboard/shared";
import {
  formatDate,
  formatTime,
  groupEventsByDay,
  EVENT_TYPE_EMOJIS,
  EVENT_TYPE_LABELS,
} from "@tripboard/shared";
import { useToast } from "@/components/ui/Toast";

function LogisticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="h-7 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />)}
      </div>
      {[1, 2].map((day) => (
        <div key={day}>
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

// Derive operational status from event data
function getEventStatus(event: TripEvent): { label: string; color: string; icon: string } {
  const now = new Date();
  const start = event.startsAt ? new Date(event.startsAt) : null;
  const hoursUntil = start ? (start.getTime() - now.getTime()) / 1000 / 3600 : null;

  if (event.type === "FLIGHT" && hoursUntil !== null) {
    if (hoursUntil < 0) return { label: "Departed", color: "text-zinc-400", icon: "✓" };
    if (hoursUntil <= 24 && hoursUntil > 0) return { label: "Check-in open", color: "text-amber-600 dark:text-amber-400", icon: "⏰" };
  }
  if (event.type === "HOTEL" && hoursUntil !== null) {
    if (hoursUntil < 0) return { label: "Checked in", color: "text-zinc-400", icon: "✓" };
    if (hoursUntil <= 4 && hoursUntil > 0) return { label: "Check-in today", color: "text-amber-600 dark:text-amber-400", icon: "⏰" };
  }

  if (event.confidence !== null && event.confidence < 0.7) {
    return { label: "Needs review", color: "text-red-500 dark:text-red-400", icon: "⚠️" };
  }

  return { label: "Confirmed", color: "text-emerald-600 dark:text-emerald-500", icon: "✓" };
}

function SourceBadge({ source, confidence }: { source: string | null; confidence: number | null }) {
  const src = source?.toLowerCase() ?? "manual";
  const label = src === "email" ? "EMAIL" : src === "pdf_upload" ? "PDF" : src === "pdf" ? "PDF" : "MANUAL";
  const bgClass =
    label === "EMAIL" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
    : label === "PDF" ? "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${bgClass}`}>
      {label}
      {confidence !== null && (
        <span className="ml-1 opacity-60">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}

function toDatetimeLocal(val: string | null | undefined): string {
  if (!val) return "";
  return new Date(val).toISOString().slice(0, 16);
}

interface EditForm {
  title: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  notes: string;
}

export function LogisticsView({ tripId }: { tripId: string }) {
  const { data: events, isLoading, error, mutate } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events?view=LOGISTICS`,
    fetcher
  );

  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<TripEvent | null>(null);
  const [form, setForm] = useState<EditForm>({ title: "", startsAt: "", endsAt: "", locationName: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<EventType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  // Derive event types present in data
  const presentTypes = useMemo<EventType[]>(() => {
    if (!events) return [];
    const seen = new Set<EventType>();
    for (const e of events) seen.add(e.type);
    return Array.from(seen);
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let list = events.slice();
    if (filterType !== "ALL") {
      list = list.filter((e) => e.type === filterType);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.locationName ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, filterType, search]);

  const isFiltering = filterType !== "ALL" || search.trim().length > 0;

  function openEdit(event: TripEvent) {
    setEditingEvent(event);
    setForm({
      title: event.title,
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: toDatetimeLocal(event.endsAt),
      locationName: event.locationName ?? "",
      notes: event.notes ?? "",
    });
  }

  function closeEdit() {
    setEditingEvent(null);
  }

  async function handleDelete(event: TripEvent) {
    setDeletingId(null);
    try {
      await fetch(`/api/trips/${tripId}/events/${event.id}`, { method: "DELETE" });
      mutate();
      toast("Event deleted");
    } catch {
      toast("Failed to delete event", "error");
    }
  }

  async function handleSave() {
    if (!editingEvent) return;
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/trips/${tripId}/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          locationName: form.locationName || null,
          notes: form.notes || null,
        }),
      });
      closeEdit();
      mutate();
      toast("Event updated");
    } catch {
      toast("Failed to save event", "error");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LogisticsSkeleton />;

  if (error) return (
    <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-500">Failed to load logistics.</p>
    </div>
  );

  if (!events?.length) return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
      <div className="text-4xl mb-3">📋</div>
      <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No bookings yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Upload a booking confirmation or forward an email to add your first event.
      </p>
    </div>
  );

  const grouped = groupEventsByDay(filteredEvents as unknown as Array<{ startsAt: string | null; [key: string]: unknown }>);
  const sortedDays = Object.keys(grouped).sort();

  const needsAttention = events.filter(e => e.confidence !== null && e.confidence < 0.7);

  return (
    <>
      {/* Filter toolbar */}
      <div className="mb-5 space-y-3">
        {/* Type chips */}
        {presentTypes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterType === "ALL"
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-700 dark:text-indigo-300"
                  : "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              All
            </button>
            {presentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? "ALL" : type)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filterType === type
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-700 dark:text-indigo-300"
                    : "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                {EVENT_TYPE_EMOJIS[type]} {EVENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Result count when filtering */}
        {isFiltering && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {filteredEvents.length} result{filteredEvents.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {isFiltering && filteredEvents.length === 0 && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center">No events match your filters.</p>
      )}

      <div className="space-y-6">
        {/* Needs attention banner */}
        {needsAttention.length > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {needsAttention.length} item{needsAttention.length > 1 ? "s" : ""} need your review
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Low extraction confidence — check the details are correct before you travel.
              </p>
            </div>
          </div>
        )}

        {sortedDays.map((day) => (
          <div key={day}>
            {/* Day header */}
            <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur py-2 mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                {day === "undated" ? "Undated" : formatDate(day)}
              </p>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {(grouped[day] as unknown as TripEvent[]).length} event{(grouped[day] as unknown as TripEvent[]).length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Events */}
            <div className="space-y-2">
              {(grouped[day] as unknown as TripEvent[]).map((event) => {
                const status = getEventStatus(event);
                const emoji = event.emoji ?? EVENT_TYPE_EMOJIS[event.type] ?? "📌";
                const label = EVENT_TYPE_LABELS[event.type] ?? event.type;

                return (
                  <div
                    key={event.id}
                    className={`group rounded-xl border bg-white dark:bg-zinc-900 px-4 py-3 transition-colors ${
                      event.confidence !== null && event.confidence < 0.7
                        ? "border-amber-200 dark:border-amber-900"
                        : "border-zinc-200/60 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Type emoji */}
                      <span className="text-xl shrink-0">{emoji}</span>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {event.title}
                          </p>
                          <SourceBadge source={event.sourceType} confidence={event.confidence} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
                          {event.locationName && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">📍 {event.locationName}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: time + status + actions */}
                      <div className="shrink-0 text-right flex items-center gap-2">
                        <div>
                          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                            {event.startsAt ? formatTime(event.startsAt, event.timezone ?? undefined) : "All day"}
                          </p>
                          <p className={`text-xs font-medium mt-0.5 ${status.color}`}>
                            {status.icon} {status.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {deletingId === event.id ? (
                            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-1">
                              <AlertTriangle size={11} className="text-red-500 shrink-0" />
                              <span className="text-xs font-medium text-red-700 dark:text-red-400">Delete?</span>
                              <button onClick={() => handleDelete(event)} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Yes</button>
                              <span className="text-red-300 dark:text-red-800">·</span>
                              <button onClick={() => setDeletingId(null)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">No</button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(event)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                                title="Edit event"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingId(event.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete event"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {event.notes && (
                      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 pl-9 italic">
                        {event.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Edit Event</h2>
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
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Location</label>
                <input
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional"
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
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
