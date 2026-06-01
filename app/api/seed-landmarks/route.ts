import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";

export async function GET() {
  try {
    await dbConnect();
    const exists = await Landmark.findOne({ name: "Demo Landmark" });
    if (exists) {
      return NextResponse.json({ message: "Demo landmark already exists", landmark: exists });
    }
    const demo = await Landmark.create({
      name: "Demo Landmark",
      description: "Test landmark inserted via seed endpoint",
      region: "Demo Region",
      city: "Demo City",
      coordinates: { latitude: 0, longitude: 0 },
      date_of_establishment: "2024",
      significance: "Demo",
      unesco_status: "None",
      visitor_info: { fee: "Free", opening_hours: "24/7" },
      gallery: [],
      embedding: [],
    });
    return NextResponse.json({ message: "Demo landmark created", landmark: demo }, { status: 201 });
  } catch (error: any) {
    console.error("Seed endpoint error:", error);
    return NextResponse.json({ error: "Failed to create demo landmark" }, { status: 500 });
  }
}
