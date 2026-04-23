import { createHash } from "crypto";

// ── Vercel Blob (production) ──────────────────────────────────────────────────
async function uploadToBlob(
  key: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ checksum: string; url: string }> {
  const { put } = await import("@vercel/blob");
  const blob = await put(key, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  });
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { checksum, url: blob.url };
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
    return uploadToBlob(key, buffer, mimeType);
  }
  return uploadToLocal(key, buffer, mimeType);
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  if (isVercel) {
    // On Vercel, files are served directly from the Blob CDN URL stored in DB
    throw new Error("Use the storageKey URL directly from the database on Vercel");
  }
  return getFromLocal(key);
}
