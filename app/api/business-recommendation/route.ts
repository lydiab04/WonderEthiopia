import { NextResponse } from "next/server";
import hf from '@/lib/huggingface'; 

// 1. Groups your specific sub-categories into your main 4 system pillars
const CATEGORY_NORMALIZER: Record<string, string> = {
  // Rooms Pillar
  "room": "rooms",
  "accommodation": "rooms",
  "dining": "rooms",
  "wellness": "rooms",
  "general_services": "rooms",

  // Events Pillar
  "event": "events",
  "venue": "events",
  "catering": "events",

  // Tours Pillar
  "tour": "tours",
  "expedition": "tours",
  "culture": "tours",
  "hiking": "tours",

  // Cars Pillar
  "car": "cars"
};

// 2. Weights Matrix: Patched so that tours and events get fair weight profiles across missing intents
const USER_PREF_MAP: Record<string, Record<string, number>> = {
  nature: {
    tours: 0.25,  // Hikes, expeditions, nature trails
    rooms: 0.10,  // Nature resorts/lodges
    events: 0.05, // Nature photography workshops / open-air venues
    cars: 0.05    // Off-road vehicles
  },
  history: {
    tours: 0.25,  // Cultural historical walks
    events: 0.15, // Historic venues or event showcases
    rooms: 0.05,  // Heritage hotels
    cars: 0.05
  },
  adventure: {
    tours: 0.30,  // High intensity expeditions/hiking paths
    cars: 0.15,   // Rough terrain rentals
    rooms: 0.05,  // Basecamps
    events: 0.05  // Adventure sports meets
  },
  culture: {
    tours: 0.25,  // Dedicated cultural tour paths
    events: 0.20, // Cultural festivals or catering experiences
    rooms: 0.05,
    cars: 0.05
  },
  gastronomy: {
    rooms: 0.20,  // Dining services/hotel kitchens
    events: 0.20, // Local event catering structures
    tours: 0.15,  // Food tasting tours
    cars: 0.05
  },
  relaxing: {
    rooms: 0.30,  // High premium on quiet accommodations/wellness spas
    cars: 0.10,   // High-tier smooth transport
    tours: 0.10,  // Leisurely botanical walking tours
    events: 0.05  // Ambient gallery gatherings
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferences = searchParams.get("preferences");

    if (!preferences) {
      return NextResponse.json({ error: "No preferences provided" }, { status: 400 });
    }

    const intents = preferences.split(",").map(p => p.trim().toLowerCase());

    // 1. Fetch backend services
    const response = await fetch("http://localhost:3000/api/services", {
      cache: 'no-store',
      method: 'GET'
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch services" }, { status: response.status });
    }

    const dataResult = await response.json(); 
    console.log("data",dataResult);
    const services = dataResult.services || [];

    // 2. Loop and construct contextual metadata strings for comprehensive vectors
    for (let service of services) {
      if (!service.embedding) {
        const featuresString = Array.isArray(service.features) ? service.features.join(", ") : "";
        
        // FIX: Safely parse category string from index [0] of the array
        const categoryString = Array.isArray(service.category) && service.category.length > 0 
          ? service.category[0] 
          : (typeof service.category === 'string' ? service.category : "");
          
        const nameString = service.name || "";
        
        const comprehensiveText = `Service Name: ${nameString}. Category: ${categoryString}. Description: ${service.description || ""}. Key Features & Amenities: ${featuresString}.`.trim();

        service.embedding = await getEmbeddings(comprehensiveText);
      }
    }

    // 3. User Input Context Parsing
    const formattedUserPrefText = `Desired features, category preferences and experience description: ${preferences}.`;
    const userEmbedding = await getEmbeddings(formattedUserPrefText);

    // 4. Calculate similarity alongside category weights matrix
    const results = recommend(userEmbedding, services, intents);

    // 5. Interleave categories to ensure tours and events are served up front
    const interleavedResults = interleaveCategories(results, ["events", "tours", "rooms", "cars"]);

    // 6. Slice down to top 9 matching results
    return NextResponse.json(interleavedResults.slice(0, 9));

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

  if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
    return embedding[0] as number[];
  }
  return embedding as number[];
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA === 0 || magB === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function recommend(userEmbedding: number[], places: any[], intents: string[]) {
  return places
    .map(place => {
      const similarity = cosineSimilarity(userEmbedding, place.embedding);
      
      // FIX: Extracts the inner category safely out of index [0] for mapping match accuracy
      const rawCategory = Array.isArray(place.category) && place.category.length > 0
        ? place.category[0]
        : (typeof place.category === 'string' ? place.category : "");

      const category = CATEGORY_NORMALIZER[rawCategory] ?? "other";

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
        normalizedCategory: category
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Distributes services round-robin based on priorityOrder, ensuring events 
 * and tours drop into the array before second-round rooms or cars appear.
 */
function interleaveCategories(sortedItems: any[], priorityOrder: string[]) {
  const groups: Record<string, any[]> = {
    events: [],
    tours: [],
    rooms: [],
    cars: [],
    other: []
  };

  for (const item of sortedItems) {
    const cat = item.normalizedCategory;
    if (groups[cat]) {
      groups[cat].push(item);
    } else {
      groups["other"].push(item);
    }
  }

  const result: any[] = [];
  let itemsRemaining = true;
  let layerIndex = 0;

  while (itemsRemaining) {
    itemsRemaining = false;

    for (const cat of priorityOrder) {
      if (groups[cat] && groups[cat][layerIndex]) {
        result.push(groups[cat][layerIndex]);
        itemsRemaining = true;
      }
    }

    if (groups["other"] && groups["other"][layerIndex]) {
      result.push(groups["other"][layerIndex]);
      itemsRemaining = true;
    }

    layerIndex++;
  }

  return result;
}