import { env } from "@xenova/transformers";

// -----------------------------
// ✅ MUST RUN IN NODE RUNTIME
// -----------------------------
export const runtime = "nodejs";

// -----------------------------
// ✅ SAFE ENV CONFIG (Vercel)
// -----------------------------
env.allowLocalModels = false;
env.useBrowserCache = false;

// Force WASM-only + disable native bindings safely
env.backends.onnx = {
  wasm: {
    numThreads: 1,
  },
  cpu: {
    disabled: true,
  },
  gpu: {
    disabled: true,
  },
} as any;

// -----------------------------
// Lazy-loaded model pipeline
// -----------------------------
let extractor: any = null;

export async function getExtractor() {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");

    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2" // ✅ lighter + Vercel-friendly
    );
  }

  return extractor;
}

// -----------------------------
// Image embedding (SAFE version)
// -----------------------------
export async function getImageEmbedding(buffer: ArrayBuffer): Promise<number[]> {
  const ext = await getExtractor();

  const blob = new Blob([buffer]);
  const { RawImage } = await import("@xenova/transformers");
  const img = await RawImage.fromBlob(blob);

  const output = await ext(img, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

// -----------------------------
// Cosine similarity (unchanged)
// -----------------------------
export function cosineSimilarity(v1: number[], v2: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    mA += v1[i] ** 2;
    mB += v2[i] ** 2;
  }

  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}
