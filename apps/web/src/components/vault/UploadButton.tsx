"use client";

import { useRef, useState } from "react";
import { MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from "@tripboard/shared";

export function UploadButton({ tripId }: { tripId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");

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

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      setError("Upload failed. Please try again.");
    }

    setUploading(false);
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
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
