import sharp from "sharp";

// Lazy-loaded references (populated by ensureBackend)
let tf: typeof import("@tensorflow/tfjs");
let nsfwModel: import("nsfwjs/core").NSFWJS;
let backendReady: Promise<void> | null = null;

function ensureBackend(): Promise<void> {
  if (!backendReady) {
    backendReady = (async () => {
      // Import tfjs and enable prod mode BEFORE nsfwjs registers kernels.
      // This suppresses all "kernel already registered" warnings and the
      // "install our node backend" message.
      tf = await import("@tensorflow/tfjs");
      tf.enableProdMode();

      // Load nsfwjs with bundled model (no CDN fetch)
      const { load } = await import("nsfwjs/core");
      const { MobileNetV2Model } = await import("nsfwjs/models/mobilenet_v2");

      nsfwModel = await load("MobileNetV2", {
        modelDefinitions: [MobileNetV2Model],
      });
    })();
  }
  return backendReady;
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
 * Uses sharp for image decoding and the CPU backend for inference.
 *
 * Returns:
 * - `allowed: false` if Porn/Hentai confidence > 0.8 (image should be rejected)
 * - `allowed: true, flagged: true` if Sexy confidence > 0.7 (save but hide from public)
 * - `allowed: true, flagged: false` for clean images (save normally)
 */
export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  await ensureBackend();

  const { data, info } = await sharp(buffer)
    .resize(224, 224)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const image = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);

  try {
    const predictions = await nsfwModel.classify(image);

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
