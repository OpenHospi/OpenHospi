import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getIdentityKeysForUsers } from "@/lib/services/key-mutations";

const MAX_USER_IDS = 50;

export async function POST(request: Request) {
  try {
    await requireApiSession(request);

    const body = (await request.json()) as { userIds?: unknown };

    if (
      !Array.isArray(body.userIds) ||
      body.userIds.length === 0 ||
      body.userIds.some((id: unknown) => typeof id !== "string")
    ) {
      return apiError("userIds must be a non-empty array of strings", 422);
    }

    if (body.userIds.length > MAX_USER_IDS) {
      return apiError(`Maximum ${MAX_USER_IDS} userIds per request`, 422);
    }

    const keys = await getIdentityKeysForUsers(body.userIds as string[]);
    return apiSuccess(keys);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
