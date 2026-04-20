import { Worker } from "bullmq";
import { prisma } from "../lib/prisma";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";
import { IngestPipeline } from "@tripboard/parsing";
import { normalizeExtractionEvent } from "@tripboard/parsing";
import { checkDuplicate } from "@tripboard/parsing";
import type { IngestJobData } from "../lib/queue";
import type { TripEvent } from "@tripboard/shared";
import { QUEUES } from "../lib/queue";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

function createConnection() {
  try {
    const url = new URL(REDIS_URL);
    return { host: url.hostname, port: parseInt(url.port || "6379") };
  } catch {
    return null;
  }
}

const connection = createConnection();

if (connection) {
  const pipeline = new IngestPipeline({
    aiProvider: process.env.AI_PROVIDER ?? "anthropic",
    aiModel: process.env.AI_MODEL ?? "claude-sonnet-4-6",
    storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  });

  const worker = new Worker<IngestJobData>(
    QUEUES.INGEST,
    async (job) => {
      const { ingestJobId, userId, tripId, source, documentId, storageKey } = job.data;
      logger.info(`Processing ingest job ${ingestJobId} (source: ${source})`);

      await prisma.ingestJob.update({
        where: { id: ingestJobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      try {
        // Download file from storage if key provided
        let rawContent: Buffer | string = "";
        if (storageKey) {
          // In a real implementation: download from storage
          // const url = await storage.getSignedUrl(storageKey);
          // rawContent = await fetch(url).then(r => r.buffer());
          rawContent = Buffer.alloc(0); // placeholder for scaffold
        }

        // Run the parsing pipeline
        const result = await pipeline.process({
          source: source as "pdf_upload" | "email_forward" | "image_upload" | "ics_import" | "manual",
          userId,
          tripId,
          raw: rawContent,
        });

        // Update document with extraction results
        if (documentId && result.extractionResult) {
          await prisma.document.update({
            where: { id: documentId },
            data: {
              status: "EXTRACTED",
              extractedData: result.extractionResult.fields,
              extractionModel: result.extractionResult.metadata.model,
              extractionConfidence: result.extractionResult.confidence,
              type: result.extractionResult.documentType.toUpperCase() as Parameters<typeof prisma.document.update>[0]["data"]["type"],
            },
          });
        }

        // Create timeline events from extraction
        let eventsCreated = 0;
        if (tripId && result.extractionResult?.events.length) {
          // Get existing events for dedup
          const existingEvents = await prisma.tripEvent.findMany({
            where: { tripId },
          });

          for (const extractedEvent of result.extractionResult.events) {
            const normalized = normalizeExtractionEvent(
              extractedEvent,
              documentId ?? "",
              source
            );

            const dedup = checkDuplicate(normalized, existingEvents as unknown as TripEvent[]);

            await prisma.tripEvent.create({
              data: {
                tripId,
                ...normalized,
                isDuplicate: dedup.isDuplicate,
                duplicateOfId: dedup.duplicateOfId || null,
              },
            });

            eventsCreated++;
          }
        }

        await prisma.ingestJob.update({
          where: { id: ingestJobId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            documentsCreated: documentId ? 1 : 0,
            eventsCreated,
          },
        });

        logger.info(`Ingest job ${ingestJobId} completed — ${eventsCreated} events created`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Ingest job ${ingestJobId} failed:`, message);

        await prisma.ingestJob.update({
          where: { id: ingestJobId },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            errorMessage: message,
          },
        });

        if (documentId) {
          await prisma.document.update({
            where: { id: documentId },
            data: { status: "FAILED" },
          });
        }

        throw err;
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err.message);
  });

  logger.info("Ingest worker started");
} else {
  logger.warn("Redis not configured — ingest worker disabled");
}
