import { z } from "zod";

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

const uuidSchema = z.uuid();

export function parseUUID(value: unknown): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw new Error("Invalid UUID");
  return result.data;
}

export function handleActionError(e: unknown): { success: false; error: string } {
  if (e instanceof Error) {
    return { success: false, error: e.message };
  }
  return { success: false, error: "An unexpected error occurred" };
}
