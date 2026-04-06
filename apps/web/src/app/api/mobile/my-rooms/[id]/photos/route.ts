import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, hasError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { moderateImage } from "@/lib/services/image-moderation";
import { saveRoomPhotoForUser } from "@/lib/services/room-mutations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slot = Number(formData.get("slot"));

    if (!file) return apiError("File required", 400);

    // Screen image for inappropriate content before saving
    const buffer = Buffer.from(await file.arrayBuffer());
    const moderation = await moderateImage(buffer);

    if (!moderation.allowed) {
      return apiError("This image contains inappropriate content", 422, "INAPPROPRIATE_CONTENT");
    }

    const result = await saveRoomPhotoForUser(session.user.id, file, id, slot, moderation.flagged);
    if (hasError(result)) return apiError(result.error, 422);

    if (moderation.flagged) {
      return NextResponse.json(
        {
          ...result,
          flagged: true,
          message: "Photo uploaded. It will be visible after a brief review.",
        },
        { status: 201 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
