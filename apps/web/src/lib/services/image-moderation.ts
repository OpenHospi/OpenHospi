import "@tensorflow/tfjs";

import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import sharp from "sharp";

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
 * Uses sharp for image decoding (instead of tfjs-node which is too large
 * for Vercel's 250MB serverless limit). Converts to raw RGB pixels then
 * creates a TF tensor for classification.
 *
 * Returns:
 * - `allowed: false` if Porn/Hentai confidence > 0.8 (image should be rejected)
 * - `allowed: true, flagged: true` if Sexy confidence > 0.7 (save but hide from public)
 * - `allowed: true, flagged: false` for clean images (save normally)
 */
export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  const nsfw = await getModel();

  // Decode image to raw RGB pixels using sharp (no native tfjs-node needed)
  const { data, info } = await sharp(buffer)
    .resize(224, 224) // NSFWJS expects 224x224 input
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const image = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);

  try {
    const predictions = await nsfw.classify(image);

    const porn = predictions.find((p) => p.className === "Porn");
    const hentai = predictions.find((p) => p.className === "Hentai");
    const sexy = predictions.find((p) => p.className === "Sexy");

    if ((porn && porn.probability > 0.8) || (hentai && hentai.probability > 0.8)) {
      return {
        allowed: false,
        flagged: false,
        category: porn?.className ?? "Hentai",
        confidence: Math.max(porn?.probability ?? 0, hentai?.probability ?? 0),
      };
    }

    if (sexy && sexy.probability > 0.7) {
      return {
        allowed: true,
        flagged: true,
        category: "Sexy",
        confidence: sexy.probability,
      };
    }

    return { allowed: true, flagged: false, category: "Neutral", confidence: 1 };
  } finally {
    image.dispose();
  }
}
