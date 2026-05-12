import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";
import AppNotification from "@/models/Notification";
import Business from "@/models/Business";

// POST - Create a new report (Tourist)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { businessId, reason, description } = body;

    if (!businessId || !reason || !description) {
      return NextResponse.json(
        { error: "businessId, reason, and description are required" },
        { status: 400 }
      );
    }

    const report = await Report.create({
      reporterId: session.user.id,
      businessId,
      reason,
      description,
      status: "pending",
    });

    const business = await Business.findById(businessId);
    if (business && business.ownerId) {
      await AppNotification.create({
        recipientRole: "business_owner",
        recipientId: business.ownerId,
        title: "Compliance Notice: Grievance Filed",
        message: `A tourist has filed a formal grievance (${reason.replace(/_/g, " ")}) against ${business.name}. Please ensure compliance during the review process.`,
        type: "report_filed",
        relatedId: report._id,
      });
      // Try to emit Pusher event if setup
      try {
        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger(`admin-notifications-business_owner-${business.ownerId}`, "new-internal-message", {
          senderName: "Integrity System",
          message: `Grievance filed against ${business.name}`,
        });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - List reports (Tourism Admin / Super-Admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["tourism_admin", "super_admin", "business_owner"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: any = {};
    
    // Strict isolation rules based on role
    if (session.user.role === "business_owner") {
      // Business owners only see reports linked to their own business
      const businesses = await Business.find({ ownerId: session.user.id });
      const businessIds = businesses.map(b => b._id);
      
      if (businessIds.length === 0) {
        return NextResponse.json({ success: true, reports: [] });
      }
      query.businessId = { $in: businessIds };
      if (status && status !== "all") query.status = status;
    } else if (session.user.role === "super_admin") {
      // Super Admins have complete visibility over all grievance states
      if (status && status !== "all") {
        query.status = status;
      }
    } else {
      // Tourism admins can see everything EXCEPT finalized records
      if (status && status !== "all") {
        query.status = status;
      }
    }

    const reports = await Report.find(query)
      .populate("reporterId", "name email")
      .populate("reviewedBy", "name")
      .populate("decidedBy", "name")
      .populate("businessId", "name isActive status")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
