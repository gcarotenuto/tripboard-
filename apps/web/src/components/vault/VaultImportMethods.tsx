"use client";

import { useRef, useState } from "react";
import { MAX_FILE_SIZE_BYTES } from "@tripboard/shared";
import { mutate } from "swr";

const EMAIL_ADDRESS = "vault@tripboard.app";

interface Props {
  tripId: string;
}

export function VaultImportMethods({ tripId }: Props) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [emailCopied, setEmailCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadDone, setUploadDone] = useState("");
  const [manualHint, setManualHint] = useState(false);

  async function handleFile(file: File) {
    setUploadError("");
    setUploadDone("");
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`);
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tripId", tripId);
    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      setUploadDone("Uploaded!");
      mutate(`/api/trips/${tripId}/documents`);
      setTimeout(() => setUploadDone(""), 3000);
    } else {
      setUploadError("Upload failed.");
    }
  }

  function copyEmail() {
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(EMAIL_ADDRESS);
      } else {
        const el = document.createElement("textarea");
        el.value = EMAIL_ADDRESS;
        el.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
    } catch {
      // copied state already shown optimistically
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      {/* Hidden file inputs */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
        Add Documents
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Forward email */}
        <button
          onClick={copyEmail}
          className={`flex flex-col gap-2.5 rounded-xl border border-dashed p-3.5 text-left transition-all group ${
            emailCopied
              ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30"
              : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300 hover:bg-blue-50/60 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
          }`}
        >
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-lg">
            {emailCopied ? "✅" : "📧"}
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Forward email</p>
            <p className={`text-[11px] leading-tight mt-0.5 ${emailCopied ? "text-blue-600 dark:text-blue-400 font-medium" : "text-zinc-400 dark:text-zinc-600"}`}>
              {emailCopied ? "✓ Copied!" : `Send to ${EMAIL_ADDRESS}`}
            </p>
          </div>
        </button>

        {/* Upload PDF */}
        <button
          onClick={() => pdfInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col gap-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-3.5 text-left transition-all hover:border-violet-300 hover:bg-violet-50/60 dark:hover:border-violet-700 dark:hover:bg-violet-950/20 group disabled:opacity-60"
        >
          <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-lg">📄</div>
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{uploading ? "Uploading…" : "Upload PDF"}</p>
            <p className="text-[11px] leading-tight mt-0.5 text-zinc-400 dark:text-zinc-600">Booking confirmation, voucher</p>
          </div>
        </button>

        {/* Scan / photo */}
        <button
          onClick={() => imgInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col gap-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-3.5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20 group disabled:opacity-60"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-lg">📸</div>
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Scan / photo</p>
            <p className="text-[11px] leading-tight mt-0.5 text-zinc-400 dark:text-zinc-600">Printed tickets, visas</p>
          </div>
        </button>

        {/* Manual entry */}
        <button
          onClick={() => { setManualHint(true); setTimeout(() => setManualHint(false), 2500); }}
          className="flex flex-col gap-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-3.5 text-left transition-all hover:border-amber-300 hover:bg-amber-50/60 dark:hover:border-amber-700 dark:hover:bg-amber-950/20 group"
        >
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-lg">✏️</div>
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Manual entry</p>
            <p className={`text-[11px] leading-tight mt-0.5 ${manualHint ? "text-amber-600 dark:text-amber-400 font-medium" : "text-zinc-400 dark:text-zinc-600"}`}>
              {manualHint ? "Coming soon" : "Type details directly"}
            </p>
          </div>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
          <span>🔒</span>
          <span>Documents parsed privately. We never scan your inbox automatically.</span>
        </div>
        {(uploadError || uploadDone) && (
          <span className={`text-[11px] font-medium ${uploadError ? "text-red-500" : "text-emerald-600"}`}>
            {uploadError || uploadDone}
          </span>
        )}
      </div>
    </div>
  );
}
