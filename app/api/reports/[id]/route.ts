import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";
import Business from "@/models/Business";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["tourism_admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const report = await Report.findById(id)
      .populate("reporterId", "name email")
      .populate("reviewedBy", "name")
      .populate("decidedBy", "name")
      .populate("businessId", "name ownerId");

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { status, adminNotes, superAdminDecision, message } = body;

    await dbConnect();
    console.log("UPDATING REPORT ID:", id);
    console.log("SESSION USER:", session.user);
    console.log("INCOMING MESSAGE:", message);

    const update: any = {};
    const pushUpdate: any = {};

    if (message && message.trim()) {
      pushUpdate.discussion = {
        senderId: session.user.id,
        senderName: session.user.name,
        senderRole: session.user.role,
        message: message.trim(),
        timestamp: new Date(),
      };
      console.log("PREPARED PUSH UPDATE:", JSON.stringify(pushUpdate, null, 2));
    }

    if (status) {
      update.status = status;
      if (session.user.role === "tourism_admin") {
        update.reviewedBy = session.user.id;
      }
    }
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    if (session.user.role === "super_admin" && superAdminDecision !== undefined) {
      update.superAdminDecision = superAdminDecision;
      update.decidedBy = session.user.id;
    }

    const report = await Report.findById(id);

    if (!report) {
      console.log("REPORT NOT FOUND IN DB FOR ID:", id);
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (Object.keys(pushUpdate).length > 0 && pushUpdate.discussion) {
      if (!report.discussion) report.discussion = [];
      report.discussion.push(pushUpdate.discussion);
      console.log("PUSHED TO DISCUSSION. NEW LOCAL LENGTH:", report.discussion.length);
    }

    if (Object.keys(update).length > 0) {
      Object.assign(report, update);
    }

    await report.save();

    // Fetch populated version for response and Pusher
    const updatedReport = await Report.findById(id)
      .populate("reporterId", "name email")
      .populate("reviewedBy", "name")
      .populate("decidedBy", "name")
      .populate("businessId", "name ownerId");

    if (!updatedReport) return NextResponse.json({ error: "Failed to reload report" }, { status: 500 });

    // Handle Business Status Updates based on report status
    if (status === "suspended") {
      await Business.findByIdAndUpdate(updatedReport.businessId._id || updatedReport.businessId, {
        $set: { isActive: false, status: "suspended" },
      });
      
      const businessOwnerId = (updatedReport?.businessId as any)?.ownerId;
      if (businessOwnerId) {
        const { default: AppNotification } = await import("@/models/Notification");
        await AppNotification.create({
          recipientRole: "business_owner",
          recipientId: businessOwnerId,
          title: "CRITICAL: Business Suspended",
          message: `Your business has been officially SUSPENDED following an investigation into a formal grievance. Admin Determination: "${superAdminDecision || adminNotes || "Policy Violation"}". If you wish to appeal this decision, you must physically report to the central Tourism Authority office with your licensing documents.`,
          type: "report_resolved",
          relatedId: report._id,
        });

        try {
          const { pusherServer } = await import("@/lib/pusher");
          await pusherServer.trigger(`admin-notifications-business_owner-${businessOwnerId}`, "new-internal-message", {
            senderName: "Integrity System",
            message: "CRITICAL: Business Suspended",
          });
        } catch (e) {}

        try {
          const User = await import("@/models/User").then(m => m.default);
          const owner = await User.findById(businessOwnerId);
          if (owner?.email) {
            const { sendSuspensionEmail } = await import("@/lib/email");
            const businessName = (updatedReport?.businessId as any)?.name || "your business";
            await sendSuspensionEmail(
              owner.email, 
              businessName, 
              superAdminDecision || adminNotes || "Severe Policy Violation"
            );
          }
        } catch (e) {
          console.error("Failed to send suspension email:", e);
        }
      }
    } else if (status === "warned") {
      const businessOwnerId = (updatedReport?.businessId as any)?.ownerId;
      if (businessOwnerId) {
        const { default: AppNotification } = await import("@/models/Notification");
        await AppNotification.create({
          recipientRole: "business_owner",
          recipientId: businessOwnerId,
          title: "OFFICIAL WARNING: Policy Violation",
          message: `Your business has received a formal warning regarding a reported grievance. Admin Note: "${superAdminDecision || adminNotes || "Please review our service policies immediately."}". Further violations may result in immediate suspension.`,
          type: "report_resolved",
          relatedId: report._id,
        });
        
        try {
          const { pusherServer } = await import("@/lib/pusher");
          await pusherServer.trigger(`admin-notifications-business_owner-${businessOwnerId}`, "new-internal-message", {
            senderName: "Integrity System",
            message: "OFFICIAL WARNING ISSUED",
          });
        } catch (e) {}

        try {
          const User = await import("@/models/User").then(m => m.default);
          const owner = await User.findById(businessOwnerId);
          if (owner?.email) {
            const { sendWarningEmail } = await import("@/lib/email");
            const businessName = (updatedReport?.businessId as any)?.name || "your business";
            await sendWarningEmail(
              owner.email, 
              businessName, 
              superAdminDecision || adminNotes || "Policy Violation. Please review our service policies immediately."
            );
          }
        } catch (e) {
          console.error("Failed to send warning email:", e);
        }
      }
    } else if (status === "dismissed") {
        const businessOwnerId = (updatedReport?.businessId as any)?.ownerId;
        if (businessOwnerId) {
            const { default: AppNotification } = await import("@/models/Notification");
            await AppNotification.create({
                recipientRole: "business_owner",
                recipientId: businessOwnerId,
                title: "Notice: Grievance Dismissed",
                message: `A grievance filed against your business was reviewed and officially dismissed. No further action is required at this time.`,
                type: "report_resolved",
                relatedId: report._id,
            });
        }
    }

    // Trigger Realtime Update for Admins
    try {
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger(`admin-reports-${id}`, "discussion-update", {
        reportId: id,
        newStatus: updatedReport.status,
        discussion: updatedReport.discussion,
      });
    } catch (e) {}

    console.log("REPORT SAVED SUCCESSFULLY, FINAL DISCUSSION LENGTH:", updatedReport?.discussion?.length);
    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
