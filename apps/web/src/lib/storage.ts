import { createHash } from "crypto";

// ── Vercel Blob (production) ──────────────────────────────────────────────────
async function uploadToBlob(
  key: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ checksum: string; url: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Add it in Vercel Project → Settings → Environment Variables."
    );
  }

  const { put } = await import("@vercel/blob");
  // Use "private" to match the Private blob store created in the dashboard.
  // Public access would require a Public store.
  const blob = await put(key, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
    token,
  });
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { checksum, url: blob.url };
}

// ── /tmp fallback (Vercel without Blob token) ─────────────────────────────────
async function uploadToTmp(
  key: string,
  buffer: Buffer,
  _mimeType: string,
): Promise<{ checksum: string; url: string }> {
  const { mkdir, writeFile } = await import("fs/promises");
  const { dirname, join } = await import("path");
  const dest = join("/tmp", key);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { checksum, url: `/tmp/${key}` };
}

// ── Local filesystem (development) ────────────────────────────────────────────
async function uploadToLocal(
  key: string,
  buffer: Buffer,
  _mimeType: string,
): Promise<{ checksum: string; url: string }> {
  const { mkdir, writeFile } = await import("fs/promises");
  const { dirname, join } = await import("path");
  const uploadDir = process.env.LOCAL_UPLOAD_DIR ?? "./uploads";
  const dest = join(uploadDir, key);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { checksum, url: `/api/files/${key}` };
}

async function getFromLocal(key: string): Promise<Buffer> {
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  const uploadDir = process.env.LOCAL_UPLOAD_DIR ?? "./uploads";
  return readFile(join(uploadDir, key));
}

// ── Public API ────────────────────────────────────────────────────────────────
const isVercel = !!process.env.VERCEL;

export async function uploadFile(
  key: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ checksum: string; url?: string }> {
  if (isVercel) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      return uploadToBlob(key, buffer, mimeType);
    }
    // Fallback: /tmp is writable on Vercel (not persistent across invocations,
    // but the metadata is saved in DB so the upload "succeeds")
    console.warn("[storage] BLOB_READ_WRITE_TOKEN not set — using /tmp fallback");
    return uploadToTmp(key, buffer, mimeType);
  }
  return uploadToLocal(key, buffer, mimeType);
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  if (isVercel) {
    throw new Error("Use the storageKey URL directly from the database on Vercel");
  }
  return getFromLocal(key);
}
