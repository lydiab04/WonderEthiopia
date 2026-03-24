import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Await params correctly in Next.js 15+
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "tourism_admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only tourism admins can review applications." },
        { status: 403 }
      );
    }

    const { recommendation, note } = await request.json();

    if (!["recommended_approve", "recommended_reject"].includes(recommendation)) {
      return NextResponse.json(
        { error: "Invalid recommendation status" },
        { status: 400 }
      );
    }

    await dbConnect();

    const { id } = await params;
    
    // Find business application
    const business = await Business.findById(id);
    
    if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.status !== "pending") {
        return NextResponse.json({ error: `Cannot review business with status: ${business.status}` }, { status: 400 });
    }

    // Update business status
    business.status = recommendation;
    business.recommendationNote = note || "";
    business.recommendedBy = session.user.id as any;
    await business.save();

    // Notify Super Admin
    try {
      await pusherServer.trigger("super-admin-notifications", "application-reviewed", {
        message: `Business ${business.name} was ${recommendation === "recommended_approve" ? "recommended for approval" : "recommended for rejection"}`,
        businessId: business._id,
      });
    } catch (e) {
      console.error("Pusher notification failed", e);
    }

    return NextResponse.json({
      message: "Application reviewed successfully",
      business,
    });
  } catch (error: any) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
