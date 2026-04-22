import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { uploadFile } from "@/lib/storage";
import { MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from "@tripboard/shared";
import { IngestPipeline, normalizeExtractionEvent, checkDuplicate } from "@tripboard/parsing";
import type { TripEvent } from "@tripboard/shared";

export const runtime = "nodejs";

const pipeline = new IngestPipeline({
  aiProvider: process.env.AI_PROVIDER ?? "anthropic",
  aiModel: process.env.AI_MODEL ?? "claude-sonnet-4-6",
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const tripId = (formData.get("tripId") as string) || undefined;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE_BYTES) return NextResponse.json({ error: "File too large" }, { status: 400 });
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) return NextResponse.json({ error: "File type not supported" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "bin";
  const key = `users/${userId}/documents/${randomUUID()}.${ext}`;

  const { checksum } = await uploadFile(key, buffer, file.type);

  const source = file.type === "text/calendar" ? "ICS_IMPORT"
               : file.type.startsWith("image/") ? "IMAGE_UPLOAD"
               : "PDF_UPLOAD";

  const ingestJob = await prisma.ingestJob.create({
    data: { userId, tripId: tripId ?? null, status: "PROCESSING", source, startedAt: new Date() },
  });

  const document = await prisma.document.create({
    data: {
      userId, tripId: tripId ?? null,
      filename: file.name, mimeType: file.type, fileSize: file.size,
      storageKey: key, type: "OTHER", status: "PENDING", source, checksum,
      ingestJobId: ingestJob.id,
    },
  });

  // Run AI extraction if API key is configured
  const hasAiKey = process.env.ANTHROPIC_API_KEY &&
                   process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key-here";
  if (hasAiKey) {
    runExtractionAsync(document.id, ingestJob.id, buffer, file.name, file.type,
                       source as "pdf_upload"|"image_upload"|"ics_import", userId, tripId);
  }

  return NextResponse.json({ data: document }, { status: 201 });
}

async function runExtractionAsync(
  documentId: string, ingestJobId: string, buffer: Buffer,
  filename: string, mimeType: string,
  source: "pdf_upload"|"image_upload"|"ics_import",
  userId: string, tripId?: string,
) {
  try {
    const result = await pipeline.process({ source, userId, tripId, raw: buffer, filename, mimeType });
    const extraction = result.extractionResult;

    if (extraction) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "EXTRACTED",
          extractedData: JSON.stringify(extraction.fields),
          extractionConfidence: extraction.confidence,
          extractionModel: extraction.metadata?.model ?? null,
          type: extraction.documentType.toUpperCase() as Parameters<typeof prisma.document.update>[0]["data"]["type"],
        },
      });

      if (tripId && extraction.events.length > 0) {
        const existing = await prisma.tripEvent.findMany({ where: { tripId } });
        for (const ev of extraction.events) {
          const normalized = normalizeExtractionEvent(ev, documentId, source);
          const dedup = checkDuplicate(normalized, existing as unknown as TripEvent[]);
          await prisma.tripEvent.create({
            data: {
              tripId, ...normalized,
              details: typeof normalized.details === "object"
                ? JSON.stringify(normalized.details)
                : (normalized.details ?? "{}"),
              isDuplicate: dedup.isDuplicate,
              duplicateOfId: dedup.duplicateOfId ?? null,
            },
          });
        }
      }

      await prisma.ingestJob.update({
        where: { id: ingestJobId },
        data: { status: "COMPLETED", completedAt: new Date(), documentsCreated: 1 },
      });
    } else {
      await prisma.document.update({ where: { id: documentId }, data: { status: "FAILED" } });
      await prisma.ingestJob.update({ where: { id: ingestJobId }, data: { status: "FAILED", completedAt: new Date() } });
    }
  } catch (err) {
    console.error("[upload] extraction failed:", err);
    await prisma.document.update({ where: { id: documentId }, data: { status: "FAILED" } }).catch(() => {});
    await prisma.ingestJob.update({ where: { id: ingestJobId }, data: { status: "FAILED", completedAt: new Date() } }).catch(() => {});
  }
}
