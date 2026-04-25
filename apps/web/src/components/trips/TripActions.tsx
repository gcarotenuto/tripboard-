"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, AlertTriangle, Archive, Copy } from "lucide-react";
import { EditTripModal } from "./EditTripModal";
import { useToast } from "@/components/ui/Toast";

interface TripActionsProps {
  tripId: string;
  tripData: {
    title: string;
    description?: string | null;
    primaryDestination?: string | null;
    status: string;
    startsAt?: Date | null;
    endsAt?: Date | null;
    tags?: string[];
  };
}

export function TripActions({ tripId, tripData }: TripActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/duplicate`, { method: "POST" });
      if (res.ok) {
        const json = await res.json() as { data: { id: string } };
        toast("Trip duplicated successfully");
        router.push(`/trips/${json.data.id}`);
        router.refresh();
      } else {
        toast("Failed to duplicate trip", "error");
      }
    } catch {
      toast("Failed to duplicate trip", "error");
    } finally {
      setDuplicating(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (res.ok) {
        toast("Trip archived");
        router.push("/archive");
        router.refresh();
      } else {
        toast("Failed to archive trip", "error");
      }
    } catch {
      toast("Failed to archive trip", "error");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/trips");
        router.refresh();
      } else {
        toast("Failed to delete trip", "error");
        setDeleting(false);
        setDeleteOpen(false);
      }
    } catch {
      toast("Failed to delete trip", "error");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 hover:text-indigo-700 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={handleDuplicate}
          disabled={duplicating}
          title="Duplicate trip"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-200 transition-all shadow-sm disabled:opacity-40"
        >
          {duplicating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
          Duplicate
        </button>
        <button
          onClick={handleArchive}
          disabled={archiving || tripData.status === "ARCHIVED"}
          title="Archive trip"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-200 transition-all shadow-sm disabled:opacity-40"
        >
          {archiving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Archive className="h-3 w-3" />}
          Archive
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400 transition-all shadow-sm"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>

      {/* Edit modal */}
      <EditTripModal
        tripId={tripId}
        initialData={tripData}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Delete confirmation */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete trip?</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 pl-0.5">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">&ldquo;{tripData.title}&rdquo;</span>{" "}
              and all its events, expenses, and journal entries will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete trip"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
