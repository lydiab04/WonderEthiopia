import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import hf from "@/lib/huggingface";
import { pipeline, RawImage } from "@xenova/transformers";
import { featureExtraction } from "@huggingface/inference";

export async function POST(req: Request) {
  await dbConnect();

  try {

    if (!req.body) {
      console.log("No body provided")
    return NextResponse.json({ error: "No body provided" }, { status: 400 });
  }

    const contentType = req.headers.get("content-type") || "";
    console.log(contentType);

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: `Expected multipart/form-data, got ${contentType}` },
      { status: 400 }
    );
  }
const formData = await req.formData();
  const file = formData.get('image') as File;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes=await file.arrayBuffer();

  
  
  // Xenova can also accept a Buffer/Uint8Array directly!
  const imageEmbedding = await getEmbeddings(bytes);

    const landmarks = await Landmark.find();

    const results = landmarks
  .map((l) => {
    // Debug: Check if the embedding actually exists
    if (!l.embedding || !Array.isArray(l.embedding)) {
      console.log(`Landmark ${l._id} has no valid embedding array`);
      return null;
    }

    const score = cosineSimilarity(imageEmbedding, l.embedding);
    
    return {
      ...l.toObject(),
      score: score,
    };
  })
  .filter(Boolean) 
  .sort((a, b) => b.score - a.score);

    return NextResponse.json(results.slice(0, 5));
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

let extractor: any;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline(
  "image-feature-extraction",
  "Xenova/clip-vit-base-patch32"
);
  }
  return extractor;
}

function cosineSimilarity(a: number[], b: number[]) {
if (a.length !== b.length) {
    console.error(`Dimension mismatch: Image is ${a.length}, DB is ${b.length}`);
    return 0; 
  }

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

export default async function getEmbeddings(image: ArrayBuffer | Buffer) {
  const extractor = await getExtractor();

  // Convert ArrayBuffer/Buffer to a Blob and then to a RawImage
  const blob = new Blob([image]);
  const img = await RawImage.fromBlob(blob);

  // Run extraction
  const output = await extractor(img, { pooled: true });

  return Array.from(output.data);
}