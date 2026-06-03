import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import { getImageEmbedding, cosineSimilarity } from "./utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("action") !== "reembed") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await dbConnect();
  const landmarks = await Landmark.find();
  const results = { success: 0, failed: 0, skipped: 0 };

  for (const landmark of landmarks) {
    const gallery: string[] = (landmark as any).gallery ?? [];
    if (!gallery.length) {
      results.skipped++;
      continue;
    }

    const embeddings: number[][] = [];

    for (const imageUrl of gallery) {
      try {
        console.log(`Fetching: ${imageUrl}`);
        const response = await fetch(imageUrl, {
          headers: {
            Referer: new URL(imageUrl).origin,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        const embedding = await getImageEmbedding(buffer);
        embeddings.push(embedding);
        console.log(`  ✓ ${imageUrl} — dim: ${embedding.length}`);
      } catch (e: any) {
        console.error(`  ✗ ${imageUrl}: ${e.message}`);
      }
    }

    if (embeddings.length === 0) {
      results.failed++;
      continue;
    }

    // Store all embeddings for this landmark
    (landmark as any).embeddings = embeddings;
    // Keep single embedding as the first one for backwards compat
    landmark.embedding = embeddings[0];
    await landmark.save();
    console.log(`✓ ${landmark.name} — ${embeddings.length} embeddings saved`);
    results.success++;
  }

  return NextResponse.json({ done: true, ...results });
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: `Expected multipart/form-data, got ${contentType}` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json({ error: "No image file" }, { status: 400 });
    }

    console.log(`Processing: ${file.name}, ${file.size} bytes`);
    const bytes = await file.arrayBuffer();
    const imageEmbedding = await getImageEmbedding(bytes);
    console.log(`Image embedding dim: ${imageEmbedding.length}`);

    const landmarks = await Landmark.find({
      $or: [
        { embeddings: { $exists: true, $not: { $size: 0 } } },
        { embedding: { $exists: true, $not: { $size: 0 } } },
      ],
    });
    console.log(`Comparing against ${landmarks.length} landmarks`);

    const results = landmarks
      .map((l) => {
        const obj = l.toObject() as any;

        // Use all embeddings if available, fall back to single embedding
        const allEmbeddings: number[][] = obj.embeddings?.length
          ? obj.embeddings
          : obj.embedding
          ? [obj.embedding]
          : [];

        if (!allEmbeddings.length) return null;

        // Take the best similarity score across all images of this landmark
        const similarity = Math.max(
          ...allEmbeddings.map((e) => cosineSimilarity(imageEmbedding, e))
        );

        return { ...obj, similarity, score: similarity };
      })
      .filter(Boolean)
      .sort((a, b) => b!.similarity - a!.similarity);

    console.log(`Top: ${results[0]?.name} — ${results[0]?.similarity.toFixed(4)}`);
    return NextResponse.json(results.slice(0, 5));
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}