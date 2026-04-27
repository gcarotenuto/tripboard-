"use client";

import { useRef, useState } from "react";
import { mutate } from "swr";
import { Check } from "lucide-react";
import { MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from "@tripboard/shared";

export function UploadButton({ tripId }: { tripId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setDone(false);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`);
      return;
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError("File type not supported. Upload PDF, image, or .ics files.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tripId", tripId);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Upload failed. Please try again.");
      } else {
        mutate(`/api/trips/${tripId}/documents`);
        if (inputRef.current) inputRef.current.value = "";
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white active:scale-95 transition-all disabled:opacity-60 ${
          done ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {uploading ? "Uploading…" : done ? <><Check className="h-4 w-4" /> Uploaded!</> : "Upload"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
