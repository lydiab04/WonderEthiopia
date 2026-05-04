import { NextResponse } from "next/server";
// Use your centralized openai instance
import hf from '@/lib/huggingface'; 

const CATEGORY_NORMALIZER: Record<string, string> = {
  "Cultural/Religious": "cultural",
  "Religious": "cultural",
  "Cultural": "cultural",

  "Archaeological": "historical",
  "Historical": "historical",

  "Natural": "nature",
  "Nature": "nature",

  "National Park": "nature",
  "Park": "nature",

  "Urban": "urban",
  "City": "urban",
};

const USER_PREF_MAP: Record<string, Record<string, number>> = {
  landscape: {
    nature: 0.2,
    cultural: -0.05,
    historical: -0.05,
  },
  parks: {
    nature: 0.25,
  },
  history: {
    historical: 0.25,
    cultural: 0.1,
  },
  religion: {
    cultural: 0.2,
  },
};

export async function GET(request: Request) {
  try {
    // 1. Get preferences from the URL query string
    const { searchParams } = new URL(request.url);
    const preferences = searchParams.get("preferences");

    if (!preferences) {
      return NextResponse.json({ error: "No preferences provided" }, { status: 400 });
    }

    const intents = preferences
  .split(",")
  .map(p => p.trim().toLowerCase());

    // 2. Fetch destinations
    const response = await fetch("http://localhost:3000/api/destinations", {
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch destinations" }, { status: response.status });
    }

    const destinations = await response.json(); 
    for (let place of destinations) {
  if (!place.embedding) {
    place.embedding = await getEmbeddings(place.description);
  }
}

    destinations.forEach((p, i) => {
  console.log("DEST", i, p.embedding);
});


    // 3. Generate embedding for the user's input
    const userEmbedding = await getEmbeddings(preferences);
    
    

    // 4. Calculate similarity and sort
    const results = recommend(userEmbedding, destinations, intents);

    // 5. Return the top 5
    return NextResponse.json(results.slice(0, 5));

  } catch (error: any) {
    console.error("Recommendation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getEmbeddings(text: string) {
  
   const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  // Return the actual vector (array of numbers)
   console.log("RAW:", embedding);
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
}

function cosineSimilarity(a: number[], b: number[]) {
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

function recommend(userEmbedding: number[], places: any[], intents: string[]) {
  return places
    .map(place => {
      const similarity = cosineSimilarity(userEmbedding, place.embedding);

      const category = CATEGORY_NORMALIZER[place.category] ?? "other";

      // category boost from user intent
      let categoryBoost = 0;

      for (const intent of intents) {
        const weights = USER_PREF_MAP[intent];
        if (weights?.[category]) {
          categoryBoost += weights[category];
        }
      }

      return {
        ...place,
        similarity,
        score: similarity + categoryBoost,
      };
    })
    .sort((a, b) => b.score - a.score);
}