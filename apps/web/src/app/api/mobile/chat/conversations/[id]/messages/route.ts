import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getMessages } from "@/lib/queries/chat";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "50");

    const result = await getMessages(session.user.id, id, cursor, limit);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
