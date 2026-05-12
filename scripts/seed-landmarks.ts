import * as dotenv from "dotenv";
import path from "path";

// Load .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import dbConnect from "../lib/mongodb";
import Landmark from "../models/Landmark";

const landmarks = [
  {
    name: "Lalibela Rock-Hewn Churches",
    description: "Famous for its monolithic rock-cut churches, Lalibela is one of Ethiopia's holiest cities.",
    region: "Amhara",
    city: "Lalibela",
    coordinates: { latitude: 12.0319, longitude: 39.0412 },
    type: "Historical",
    gallery: ["https://whc.unesco.org/uploads/thumbs/site_0018_0001-750-750-20121017154257.jpg"],
    unesco_status: "World Heritage Site",
  },
  {
    name: "Simien Mountains National Park",
    description: "Spectacular landscape with jagged peaks, deep valleys and sharp precipices.",
    region: "Amhara",
    city: "Debark",
    coordinates: { latitude: 13.1833, longitude: 38.0667 },
    type: "National Park",
    gallery: ["https://whc.unesco.org/uploads/thumbs/site_0009_0001-750-750-20120822153206.jpg"],
    unesco_status: "World Heritage Site",
  },
  {
    name: "Axum Obelisk",
    description: "The ruins of the ancient city of Aksum, near Ethiopia's northern border.",
    region: "Tigray",
    city: "Axum",
    coordinates: { latitude: 14.1299, longitude: 38.7185 },
    type: "Historical",
    gallery: ["https://whc.unesco.org/uploads/thumbs/site_0015_0001-750-750-20121017124317.jpg"],
    unesco_status: "World Heritage Site",
  },
  {
      name: "Fasil Ghebbi, Gondar",
      description: "The fortress-city of Fasil Ghebbi was the residence of the Ethiopian emperor Fasilides and his successors.",
      region: "Amhara",
      city: "Gondar",
      coordinates: { latitude: 12.6078, longitude: 37.4697 },
      type: "Historical",
      gallery: ["https://whc.unesco.org/uploads/thumbs/site_0019_0001-750-750-20151104115124.jpg"],
      unesco_status: "World Heritage Site",
  }
];

async function seed() {
  try {
    await dbConnect();

    for (const l of landmarks) {
      const existing = await Landmark.findOne({ name: l.name });
      if (existing) {
        console.log(`Landmark ${l.name} already exists.`);
        continue;
      }
      await Landmark.create(l);
      console.log(`Created landmark: ${l.name}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
