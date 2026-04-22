import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

function uploadDir(): string {
  return process.env.LOCAL_UPLOAD_DIR ?? "./uploads";
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  _mimeType: string,
): Promise<{ checksum: string }> {
  const dest = join(uploadDir(), key);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { checksum };
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  const src = join(uploadDir(), key);
  return readFile(src);
}
