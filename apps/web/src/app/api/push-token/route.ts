import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { pushTokens } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { expoPushToken, deviceType } = body;

  if (!expoPushToken || typeof expoPushToken !== "string") {
    return NextResponse.json({ error: "Missing expoPushToken" }, { status: 400 });
  }

  await db
    .insert(pushTokens)
    .values({
      userId: session.user.id,
      expoPushToken,
      deviceType: deviceType || null,
    })
    .onConflictDoUpdate({
      target: [pushTokens.userId, pushTokens.expoPushToken],
      set: { active: true, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { expoPushToken } = body;

  if (!expoPushToken || typeof expoPushToken !== "string") {
    return NextResponse.json({ error: "Missing expoPushToken" }, { status: 400 });
  }

  await db
    .update(pushTokens)
    .set({ active: false })
    .where(
      and(eq(pushTokens.expoPushToken, expoPushToken), eq(pushTokens.userId, session.user.id)),
    );

  return NextResponse.json({ success: true });
}
