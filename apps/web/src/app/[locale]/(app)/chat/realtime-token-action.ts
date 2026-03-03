"use server";

import { createHmac } from "node:crypto";

import { requireSession } from "@/lib/auth-server";

function base64url(data: Buffer): string {
  return data.toString("base64url");
}

export async function getRealtimeToken(): Promise<string> {
  const session = await requireSession();
  const userId = session.user.id;

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: userId,
    role: "authenticated",
    iss: "supabase",
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const segments = [
    base64url(Buffer.from(JSON.stringify(header))),
    base64url(Buffer.from(JSON.stringify(payload))),
  ];

  const signature = createHmac("sha256", secret).update(segments.join(".")).digest();
  segments.push(base64url(signature));

  return segments.join(".");
}
