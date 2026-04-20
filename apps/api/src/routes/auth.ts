import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { createError } from "../middleware/error";

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterSchema = LoginSchema.extend({
  name: z.string().min(1).max(100),
});

// POST /auth/register
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError(409, "Email already registered"));

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // Store password in account record
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id,
        access_token: passwordHash,
      },
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({ data: { user, token } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
    if (!user) return next(createError(401, "Invalid email or password"));

    const account = await prisma.account.findFirst({
      where: { userId: user.id, provider: "credentials" },
    });
    if (!account?.access_token) return next(createError(401, "Invalid email or password"));

    const valid = await bcrypt.compare(password, account.access_token);
    if (!valid) return next(createError(401, "Invalid email or password"));

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret",
      { expiresIn: "7d" }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "login",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});
