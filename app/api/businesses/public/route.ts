import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

// GET - List approved businesses for the public landing page
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    await dbConnect();

    const businesses = await Business.find({ status: "approved" })
      .select("name description category location contactPhone contactEmail") // Only fetch safe/public fields
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json({ businesses });
  } catch (error: unknown) {
    console.error("Error fetching public businesses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
