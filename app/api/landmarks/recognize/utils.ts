export async function getImageEmbedding(bytes: ArrayBuffer): Promise<number[]> {
  const base64 = Buffer.from(bytes).toString("base64");

  // Step 1: Describe the image with LLaVA
  const visionResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: Array.from(new Uint8Array(bytes)),
        prompt: "Describe this landmark image in detail",
        max_tokens: 256,
      }),
    }
  );

  const visionData = await visionResponse.json();
  console.log("LLaVA response:", JSON.stringify(visionData)); // ← see the structure

  const description = visionData?.result?.response ?? visionData?.response ?? "";
  if (!description) throw new Error("No description from vision model");

  // Step 2: Embed the description
  const embedResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-large-en-v1.5`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [description] }), // ← array format
    }
  );

  const embedData = await embedResponse.json();
  console.log("BGE response:", JSON.stringify(embedData)); // ← see the structure

  const embedding = embedData?.result?.data?.[0] ?? embedData?.data?.[0];
  if (!embedding) throw new Error(`No embedding returned: ${JSON.stringify(embedData)}`);

  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
