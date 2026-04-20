import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { storage } from "../lib/storage";
import { enqueueIngestJob } from "../lib/queue";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/error";
import { MAX_FILE_SIZE_BYTES } from "@tripboard/shared";
import { randomUUID } from "crypto";

export const documentsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// GET /trips/:tripId/documents
documentsRouter.get("/:tripId/documents", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const documents = await prisma.document.findMany({
      where: { tripId: req.params.tripId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: documents });
  } catch (err) {
    next(err);
  }
});

// POST /documents/upload  (multipart form — tripId in body)
documentsRouter.post("/documents/upload", requireAuth, upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return next(createError(400, "No file provided"));

    const { tripId } = req.body as { tripId?: string };
    const file = req.file;

    // Generate a unique storage key
    const ext = file.originalname.split(".").pop() ?? "bin";
    const key = `users/${req.userId}/documents/${randomUUID()}.${ext}`;

    // Upload to storage
    const { checksum } = await storage.upload(key, file.buffer, file.mimetype);

    // Create ingest job record
    const ingestJob = await prisma.ingestJob.create({
      data: {
        userId: req.userId!,
        tripId: tripId || null,
        status: "QUEUED",
        source: file.mimetype === "text/calendar" ? "ICS_IMPORT" : "PDF_UPLOAD",
      },
    });

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId: req.userId!,
        tripId: tripId || null,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey: key,
        type: "OTHER",
        status: "PENDING",
        source: "PDF_UPLOAD",
        checksum,
        ingestJobId: ingestJob.id,
      },
    });

    // Enqueue background processing
    await enqueueIngestJob({
      ingestJobId: ingestJob.id,
      userId: req.userId!,
      tripId: tripId,
      source: "pdf_upload",
      documentId: document.id,
      storageKey: key,
    });

    res.status(201).json({ data: document });
  } catch (err) {
    next(err);
  }
});

// DELETE /trips/:tripId/documents/:docId
documentsRouter.delete("/:tripId/documents/:docId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.docId, tripId: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!doc) return next(createError(404, "Document not found"));

    await prisma.document.update({
      where: { id: doc.id },
      data: { deletedAt: new Date() },
    });

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});
