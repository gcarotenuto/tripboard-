import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, preferences: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let preferences: Record<string, unknown> = {};
  try {
    preferences = JSON.parse(user.preferences ?? "{}");
  } catch {
    preferences = {};
  }

  return NextResponse.json({ name: user.name, email: user.email, preferences });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const body = await req.json();

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let currentPrefs: Record<string, unknown> = {};
  try {
    currentPrefs = JSON.parse(existing.preferences ?? "{}");
  } catch {
    currentPrefs = {};
  }

  const mergedPrefs = body.preferences
    ? { ...currentPrefs, ...body.preferences }
    : currentPrefs;

  const updateData: { name?: string; preferences: string } = {
    preferences: JSON.stringify(mergedPrefs),
  };

  if (typeof body.name === "string") {
    updateData.name = body.name;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { name: true, email: true, preferences: true },
  });

  return NextResponse.json({
    name: updated.name,
    email: updated.email,
    preferences: mergedPrefs,
  });
}
