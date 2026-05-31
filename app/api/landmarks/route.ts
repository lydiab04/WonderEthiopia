import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import getImageEmbedding from "./recognize/route";

export async function GET() {
  await dbConnect();

  try {
    const landmarks = await Landmark.find(); // ✅ FIXED

    return NextResponse.json(landmarks);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  await dbConnect();

  try {
    // 1. Read directly as JSON matching your frontend layout setup
    const body = await request.json();
    const { 
      name, description, region, city, gallery, coordinates, 
      date_of_establishment, significance, unesco_status, visitor_info 
    } = body;

    const allEmbeddings = [];
    const galleryPaths: string[] = [];

    // Ensure gallery is an array of strings (Base64 data URLs)
    const galleryItems = Array.isArray(gallery) ? gallery : [];

    for (const item of galleryItems) {
      if (typeof item !== "string") continue;

      const arrayBuffer = await getArrayBufferFromItem(item);
      if (!arrayBuffer) continue;

      // Generate vector embedding data using your model layout
      const embedding = await getImageEmbedding(arrayBuffer);
      allEmbeddings.push(embedding);
      
      // If saving locally or sending raw strings back to inventory client:
      galleryPaths.push(item);
    }

    // Isolate vector coordinates for your search query engine matching structure
    const primaryEmbedding = allEmbeddings.length > 0 ? allEmbeddings[0] : [];

    const landmark = await Landmark.create({
      name,
      description,
      region,
      city,
      coordinates: {
        longitude: parseFloat(coordinates?.longitude) || 0,
        latitude: parseFloat(coordinates?.latitude) || 0
      },
      date_of_establishment,
      significance,
      unesco_status,
      visitor_info: {
        fee: visitor_info?.fee || "",
        opening_hours: visitor_info?.opening_hours || ""
      },
      gallery: galleryPaths,
      embedding: primaryEmbedding
    });

    return NextResponse.json(landmark);

  } catch (error: any) {
    console.error("Post Error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}


async function getArrayBufferFromItem(item: string): Promise<ArrayBuffer | null> {
  try {
    if (item.startsWith("data:image")) {
      // Handle Base64 Data URL
      const base64Data = item.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } else if (item.startsWith("http")) {
      // Handle absolute URL fallback
      const response = await fetch(item);
      if (!response.ok) return null;
      return await response.arrayBuffer();
    }
    return null;
  } catch (error) {
    console.error("Error converting image item to buffer:", error);
    return null;
  }
}