import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getApplicationDetail } from "@/lib/queries/applications";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const detail = await getApplicationDetail(id, session.user.id);
    if (!detail) return apiError("Application not found", 404);
    return NextResponse.json(detail);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
