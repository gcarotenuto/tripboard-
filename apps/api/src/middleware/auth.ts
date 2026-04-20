import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ??
    req.cookies?.["next-auth.session-token"];

  if (!token) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret") as {
      sub?: string;
      id?: string;
    };
    req.userId = payload.sub ?? payload.id;
    next();
  } catch {
    res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Token is invalid or expired" } });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret") as {
        sub?: string;
        id?: string;
      };
      req.userId = payload.sub ?? payload.id;
    } catch {}
  }
  next();
}
