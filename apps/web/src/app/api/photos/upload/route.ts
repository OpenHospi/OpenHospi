import {
  ALLOWED_IMAGE_TYPES,
  MAX_AVATAR_SIZE,
  MAX_ROOM_PHOTO_SIZE,
} from "@openhospi/shared/constants";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }

        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const type = payload.type as string;

        if (type !== "profile" && type !== "room") {
          throw new Error("Invalid upload type");
        }

        const maxSize = type === "room" ? MAX_ROOM_PHOTO_SIZE : MAX_AVATAR_SIZE;

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES as unknown as string[],
          maximumSizeInBytes: maxSize,
          tokenPayload: JSON.stringify({ userId: session.user.id, ...payload }),
        };
      },
      onUploadCompleted: async () => {
        // DB update happens client-side via server action after upload completes.
        // This callback only fires in deployed environments (not localhost).
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
