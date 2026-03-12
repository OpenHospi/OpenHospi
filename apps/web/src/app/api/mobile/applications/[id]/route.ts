import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getApplicationDetail } from "@/lib/queries/applications";
import { getInvitationForApplication } from "@/lib/queries/invitations";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const [detail, invitation] = await Promise.all([
      getApplicationDetail(id, session.user.id),
      getInvitationForApplication(id, session.user.id),
    ]);
    if (!detail) return apiError("Application not found", 404);
    return NextResponse.json({ ...detail, invitation: invitation ?? null });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
