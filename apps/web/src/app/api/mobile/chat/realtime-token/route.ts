import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";

function base64url(data: Buffer): string {
  return data.toString("base64url");
}

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) return apiError("Realtime not configured", 500);

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      sub: userId,
      role: "authenticated",
      iss: "supabase",
      iat: now,
      exp: now + 3600,
    };

    const segments = [
      base64url(Buffer.from(JSON.stringify(header))),
      base64url(Buffer.from(JSON.stringify(payload))),
    ];

    const signature = createHmac("sha256", secret).update(segments.join(".")).digest();
    segments.push(base64url(signature));

    return apiSuccess({ token: segments.join(".") });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
