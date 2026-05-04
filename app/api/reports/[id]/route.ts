import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";
import Business from "@/models/Business";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["tourism_admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, superAdminDecision } = body;

    await dbConnect();

    const update: any = {};

    // Tourism admin can set status and notes (triage)
    if (status) {
      update.status = status;
      update.reviewedBy = session.user.id;
    }
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    // Only super_admin can write final decision
    if (session.user.role === "super_admin" && superAdminDecision !== undefined) {
      update.superAdminDecision = superAdminDecision;
      update.decidedBy = session.user.id;
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("reporterId", "name email")
      .populate("reviewedBy", "name")
      .populate("decidedBy", "name")
      .populate("businessId", "name ownerId");

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Handle Super Admin Notifications
    if (session.user.role === "super_admin" && ["resolved", "dismissed"].includes(status)) {
      const businessOwnerId = (report.businessId as any)?.ownerId;
      
      if (businessOwnerId) {
        const { default: AppNotification } = await import("@/models/Notification");
        let title = "";
        let message = "";

        if (status === "resolved") {
          if (body.suspendBusiness) {
            await Business.findByIdAndUpdate(report.businessId, {
              $set: { isActive: false, status: "suspended" },
            });
            title = "CRITICAL: Business Suspended";
            message = `Your business has been officially SUSPENDED following an investigation into a formal grievance. Super Admin Decision: "${superAdminDecision}". If you wish to appeal this decision, you must physically report to the central Tourism Authority office with your licensing documents.`;
          } else {
            title = "Warning: Grievance Resolved";
            message = `A grievance against your business was reviewed and resolved. Super Admin Note: "${superAdminDecision}". Please strictly follow platform compliance guidelines to avoid future actions.`;
          }
        } else if (status === "dismissed") {
          title = "Notice: Grievance Dismissed";
          message = `A grievance filed against your business was reviewed and officially dismissed by the Super Admin. No action is required.`;
        }

        await AppNotification.create({
          recipientRole: "business_owner",
          recipientId: businessOwnerId,
          title,
          message,
          type: "report_resolved",
          relatedId: report._id,
        });

        try {
          const { pusherServer } = await import("@/lib/pusher");
          await pusherServer.trigger(`admin-notifications-business_owner-${businessOwnerId}`, "new-internal-message", {
            senderName: "Integrity System",
            message: title,
          });
        } catch (e) {}
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
