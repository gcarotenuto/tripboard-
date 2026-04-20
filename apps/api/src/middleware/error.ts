import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.flatten(),
      },
    });
    return;
  }

  // Known error shapes
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    const e = err as { status: number; message: string; code?: string };
    res.status(e.status).json({
      error: { code: e.code ?? "ERROR", message: e.message },
    });
    return;
  }

  // Unknown errors
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error("Unhandled error:", err);

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}

export function createError(status: number, message: string, code?: string) {
  return Object.assign(new Error(message), { status, code });
}
