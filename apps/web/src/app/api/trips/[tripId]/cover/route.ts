import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `covers/${params.tripId}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { url } = await uploadFile(key, buffer, file.type);

  const updated = await prisma.trip.update({
    where: { id: params.tripId },
    data: { coverImageUrl: url ?? null },
  });

  return NextResponse.json({ data: { coverImageUrl: updated.coverImageUrl } });
}
