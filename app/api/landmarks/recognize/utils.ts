export const runtime = "nodejs";

let extractor: any = null;
let envReady = false;

/**
 * Initialize environment BEFORE pipeline loads
 */
async function initEnv() {
  if (envReady) return;

  // 1. Changed to dynamic import()
  const { env } = await import("@xenova/transformers");

  // 🚨 FORCE PURE WASM MODE (CRITICAL FIX)
  env.backends = {
    onnx: {
      wasm: {
        numThreads: 1,
      },
    },
  };

  env.allowLocalModels = false;
  env.useBrowserCache = false;

  // 🚨 VERCEL FIX: Force cache into the only writable directory allocated to serverless functions
  env.cacheDir = "/tmp/transformers-cache";

  envReady = true;
}

/**
 * Load model lazily
 */
export async function getExtractor() {
  if (!extractor) {
    await initEnv();

    // 2. Changed to dynamic import()
    const { pipeline } = await import("@xenova/transformers");

    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }

  return extractor;
}

/**
 * Convert image → embedding vector
 */
export async function getImageEmbedding(buffer: ArrayBuffer): Promise<number[]> {
  // 3. Changed to dynamic import()
  const { RawImage } = await import("@xenova/transformers");

  const model = await getExtractor();

  const blob = new Blob([buffer]);
  const image = await RawImage.fromBlob(blob);

  const output = await model(image, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

/**
 * Cosine similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
