import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import AppNotification from "@/models/Notification";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["super_admin", "tourism_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const business = await Business.findById(id)
      .populate("ownerId", "name email")
      .populate("recommendedBy", "name")
      .populate("decidedBy", "name")
      .lean();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch all notifications related to this business for a full audit trail
    const notifications = await AppNotification.find({ relatedId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ business, notifications, success: true });
  } catch (error) {
    console.error("Admin Business Detail Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
