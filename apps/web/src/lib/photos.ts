import { del } from "@vercel/blob";

export async function deletePhotoFromStorage(url: string): Promise<void> {
  await del(url);
}
