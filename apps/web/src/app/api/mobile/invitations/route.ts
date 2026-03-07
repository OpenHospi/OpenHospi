import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getUserInvitations } from "@/lib/queries/invitations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const invitations = await getUserInvitations(session.user.id);
    return NextResponse.json(invitations);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
