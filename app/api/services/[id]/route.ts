import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import Business from "@/models/Business";
import Review from "@/models/Review";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    console.log("Service Detail API: Fetching ID", id);

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const service = await Service.findById(id).populate("businessId", "name location contactPhone contactEmail profilePicture description");
    
    if (!service) {
      console.log("Service Detail API: Service not found for ID", id);
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    console.log("Service Detail API: Found service", service.name);

    // Fetch reviews specifically for this service
    const reviews = await Review.find({ targetId: id, targetType: "service" })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({ 
      success: true, 
      service, 
      reviews,
      avgRating
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
