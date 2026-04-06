import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs-node";

// Singleton model instance (lazy loaded on first use, like the DB proxy)
let model: nsfwjs.NSFWJS | null = null;

async function getModel(): Promise<nsfwjs.NSFWJS> {
  if (!model) {
    model = await nsfwjs.load();
  }
  return model;
}

export type ModerationResult = {
  allowed: boolean;
  flagged: boolean;
  category: string;
  confidence: number;
};

/**
 * Screen an image buffer for inappropriate content using NSFWJS.
 *
 * Returns:
 * - `allowed: false` if Porn/Hentai confidence > 0.8 (image should be rejected)
 * - `allowed: true, flagged: true` if Sexy confidence > 0.7 (save but hide from public)
 * - `allowed: true, flagged: false` for clean images (save normally)
 */
export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  const nsfw = await getModel();
  const image = tf.node.decodeImage(buffer, 3);

  try {
    const predictions = await nsfw.classify(image as tf.Tensor3D);

    const porn = predictions.find((p) => p.className === "Porn");
    const hentai = predictions.find((p) => p.className === "Hentai");
    const sexy = predictions.find((p) => p.className === "Sexy");

    // Reject: explicit content
    if ((porn && porn.probability > 0.8) || (hentai && hentai.probability > 0.8)) {
      return {
        allowed: false,
        flagged: false,
        category: porn?.className ?? "Hentai",
        confidence: Math.max(porn?.probability ?? 0, hentai?.probability ?? 0),
      };
    }

    // Flag: sexually suggestive (save but needs admin review)
    if (sexy && sexy.probability > 0.7) {
      return {
        allowed: true,
        flagged: true,
        category: "Sexy",
        confidence: sexy.probability,
      };
    }

    // Allow: clean image
    return { allowed: true, flagged: false, category: "Neutral", confidence: 1 };
  } finally {
    image.dispose();
  }
}
