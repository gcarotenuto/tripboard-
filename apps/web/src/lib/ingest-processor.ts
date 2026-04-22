import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { IngestPipeline, normalizeExtractionEvent, checkDuplicate } from "@tripboard/parsing";
import type { TripEvent } from "@tripboard/shared";

export interface ProcessEmailParams {
  from: string;
  subject: string;
  body: string;
  tripId?: string;
  userId: string;
}

export interface ProcessEmailResult {
  ingestJobId: string;
  documentId: string;
  documentType: string;
  confidence: number;
  fields: Record<string, unknown>;
  eventsCreated: number;
  errors: string[];
}

const pipeline = new IngestPipeline({
  aiProvider: process.env.AI_PROVIDER ?? "anthropic",
  aiModel: process.env.AI_MODEL ?? "claude-sonnet-4-6",
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
});

export async function processEmailInline(params: ProcessEmailParams): Promise<ProcessEmailResult> {
  const { from, subject, body, tripId, userId } = params;
  const errors: string[] = [];

  // Step 1: Create IngestJob with PROCESSING status
  const ingestJob = await prisma.ingestJob.create({
    data: {
      userId,
      tripId: tripId ?? null,
      status: "PROCESSING",
      source: "EMAIL_FORWARD",
      startedAt: new Date(),
    },
  });

  const documentId = randomUUID();
  const emailId = randomUUID();

  // Step 2: Build Mailgun-format JSON payload that EmailAdapter can parse
  const emailPayload = {
    from: from || "unknown@sender.com",
    to: "vault@tripboard.app",
    subject,
    "body-plain": body,
    "stripped-text": body,
  };

  // Step 3: Create Document record with PENDING status
  const storageKey = `users/${userId}/emails/${emailId}.eml`;
  const document = await prisma.document.create({
    data: {
      id: documentId,
      userId,
      tripId: tripId ?? null,
      filename: `Email: ${subject.slice(0, 100)}.eml`,
      mimeType: "message/rfc822",
      fileSize: body.length,
      storageKey,
      source: "EMAIL_FORWARD",
      status: "PENDING",
      ingestJobId: ingestJob.id,
    },
  });

  // Step 4: Run IngestPipeline
  let result;
  try {
    result = await pipeline.process({
      source: "email_forward",
      userId,
      tripId,
      raw: JSON.stringify(emailPayload),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(message);
    console.error(`IngestPipeline failed for job ${ingestJob.id}:`, message);
  }

  const extraction = result?.extractionResult;
  let eventsCreated = 0;

  if (extraction) {
    // Step 5: Update Document with extraction result
    try {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "EXTRACTED",
          extractedData: JSON.stringify(extraction.fields),
          extractionConfidence: extraction.confidence,
          extractionModel: extraction.metadata?.model ?? null,
          type: extraction.documentType.toUpperCase() as Parameters<typeof prisma.document.update>[0]["data"]["type"],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Document update failed: ${message}`);
    }

    // Step 6: Create TripEvent records if tripId is provided
    if (tripId && extraction.events.length > 0) {
      try {
        const existingEvents = await prisma.tripEvent.findMany({
          where: { tripId },
        });

        for (const extractedEvent of extraction.events) {
          const normalized = normalizeExtractionEvent(
            extractedEvent,
            document.id,
            "email_forward"
          );

          const dedup = checkDuplicate(normalized, existingEvents as unknown as TripEvent[]);

          await prisma.tripEvent.create({
            data: {
              tripId,
              ...normalized,
              isDuplicate: dedup.isDuplicate,
              duplicateOfId: dedup.duplicateOfId ?? null,
            },
          });

          eventsCreated++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Event creation failed: ${message}`);
      }
    }
  } else {
    // Set Document status to FAILED if extraction failed
    try {
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "FAILED" },
      });
    } catch {
      // ignore secondary failure
    }
    if (errors.length === 0) {
      errors.push("AI extraction returned no result");
    }
  }

  // Step 7: Update IngestJob status
  const jobStatus = errors.length > 0 && !extraction ? "FAILED" : "COMPLETED";
  await prisma.ingestJob.update({
    where: { id: ingestJob.id },
    data: {
      status: jobStatus,
      completedAt: new Date(),
      documentsCreated: 1,
      eventsCreated,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    },
  });

  // Step 8: Return result
  return {
    ingestJobId: ingestJob.id,
    documentId: document.id,
    documentType: extraction?.documentType ?? "OTHER",
    confidence: extraction?.confidence ?? 0,
    fields: (extraction?.fields ?? {}) as Record<string, unknown>,
    eventsCreated,
    errors,
  };
}
