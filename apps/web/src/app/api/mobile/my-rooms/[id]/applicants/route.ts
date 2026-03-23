import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getRoomApplicants } from "@/lib/queries/applicants";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const applicants = await getRoomApplicants(id, session.user.id);

    return NextResponse.json({
      applicants: applicants.map((a) => ({
        ...a,
        appliedAt: a.appliedAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
