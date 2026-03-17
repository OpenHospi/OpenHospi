import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { acknowledgeDistribution } from "@/lib/services/key-mutations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiSession(request);
    const { id } = await params;

    await acknowledgeDistribution(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
