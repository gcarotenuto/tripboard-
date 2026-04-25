"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface CoverUploadProps {
  tripId: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}

export function CoverUpload({ tripId, onUpload }: CoverUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/trips/${tripId}/cover`, {
        method: "POST",
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Upload failed");
        return;
      }

      onUpload(body.data.coverImageUrl);
      toast("Cover photo updated");
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
      // Reset so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      className="relative"
      onClick={(e) => {
        // Prevent the Link parent from navigating when clicking the upload button
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors disabled:opacity-60"
        title="Change cover image"
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>

      {error && (
        <span className="absolute bottom-10 right-0 whitespace-nowrap rounded-md bg-red-600 px-2 py-1 text-[11px] text-white shadow-lg">
          {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
