import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";
  const jwtSecret = process.env.NEXTAUTH_SECRET ?? "dev-secret";

  // Sign a short-lived JWT for the backend using the same secret it verifies with
  const secret = new TextEncoder().encode(jwtSecret);
  const backendToken = await new SignJWT({ sub: userId, id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  const res = await fetch(`${apiUrl}/ingest/email/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${backendToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
