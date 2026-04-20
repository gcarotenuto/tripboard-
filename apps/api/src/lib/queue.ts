import { Queue, Worker, type Job } from "bullmq";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let connection: { host: string; port: number } | undefined;

try {
  const url = new URL(REDIS_URL);
  connection = { host: url.hostname, port: parseInt(url.port || "6379") };
} catch {
  logger.warn("Invalid REDIS_URL — queue jobs will be disabled");
}

export const QUEUES = {
  INGEST: "ingest",
  AI_EXTRACT: "ai-extract",
  MEMORY_RECAP: "memory-recap",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export interface IngestJobData {
  ingestJobId: string;
  userId: string;
  tripId?: string;
  source: string;
  documentId?: string;
  storageKey?: string;
}

export interface RecapJobData {
  tripId: string;
  userId: string;
}

let ingestQueue: Queue<IngestJobData> | null = null;
let recapQueue: Queue<RecapJobData> | null = null;

export function getIngestQueue(): Queue<IngestJobData> | null {
  if (!connection) return null;
  if (!ingestQueue) {
    ingestQueue = new Queue<IngestJobData>(QUEUES.INGEST, { connection });
  }
  return ingestQueue;
}

export function getRecapQueue(): Queue<RecapJobData> | null {
  if (!connection) return null;
  if (!recapQueue) {
    recapQueue = new Queue<RecapJobData>(QUEUES.MEMORY_RECAP, { connection });
  }
  return recapQueue;
}

export async function enqueueIngestJob(data: IngestJobData): Promise<string | null> {
  const queue = getIngestQueue();
  if (!queue) {
    logger.warn("Queue not available — processing ingest job inline (no Redis)");
    return null;
  }
  const job = await queue.add("process", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
  return job.id ?? null;
}

export async function enqueueRecapJob(data: RecapJobData): Promise<string | null> {
  const queue = getRecapQueue();
  if (!queue) return null;
  const job = await queue.add("generate", data, {
    attempts: 2,
    removeOnComplete: 50,
  });
  return job.id ?? null;
}
