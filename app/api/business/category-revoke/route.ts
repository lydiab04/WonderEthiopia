import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

type Category = "hotel" | "tour_operator" | "car_rental" | "event_organizer";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import AppNotification from "@/models/Notification";
import { pusherServer } from "@/lib/pusher";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const formData = await req.formData();
    const category = formData.get("category") as Category;
    const reason = formData.get("reason") as string;
    const file = formData.get("document") as File | null;

    if (!category || !reason) {
      return NextResponse.json({ error: "Category and reason are required" }, { status: 400 });
    }

    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const currentCats = (Array.isArray(business.category) ? business.category : [business.category]) as Category[];
    
    if (currentCats.length <= 1) {
      return NextResponse.json({ error: "Cannot revoke your only operating domain. Please contact support to initiate full business closure." }, { status: 400 });
    }

    if (!(currentCats as string[]).includes(category)) {
      return NextResponse.json({ error: "Your business does not hold credentials for this domain." }, { status: 400 });
    }

    let documentAttachment = "";
    let documentUrl = "";
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

      const uploaded = await cloudinary.uploader.upload(base64, {
        folder: "revocations",
        resource_type: "auto",
        public_id: `revoke_${Date.now()}_${file.name.replace(/\s+/g, "_").split(".")[0]}`,
      });

      const publicUrl = uploaded.secure_url;
      documentAttachment = `\n\n**Supporting Administrative Document:** [${file.name}](${publicUrl})`;
      documentUrl = publicUrl;
    }

    // Push into formal history logs
    if (!business.historyLogs) business.historyLogs = [];
    business.historyLogs.push({
      action: "Domain Revoked",
      description: `Surrendered "${category}" domain. Justification: ${reason}`,
      date: new Date(),
      documentUrl: documentUrl || undefined,
    });

    // Revoke the category
    business.category = currentCats.filter((c) => c !== category);
    await business.save();

    const notifMessage = `Business "${business.name}" has voluntarily revoked their credential for the "${category}" domain.\n\n**Justification provided:** ${reason}${documentAttachment}`;

    // Create a notification for the admins so they have a trail of the revocation and reason
    await AppNotification.create({
      recipientRole: "super_admin",
      title: "Domain Revocation Logged",
      message: notifMessage,
      type: "business_status_update",
      relatedId: business._id,
    });
    
    await AppNotification.create({
      recipientRole: "tourism_admin",
      title: "Domain Revocation Logged",
      message: notifMessage,
      type: "business_status_update",
      relatedId: business._id,
    });

    // Fire real-time notification to active admin sessions
    try {
      const payload = {
        businessId: business._id,
        senderName: "System",
        message: `Business "${business.name}" revoked the "${category}" domain.`,
      };
      await pusherServer.trigger("admin-notifications-super_admin", "new-internal-message", payload);
      await pusherServer.trigger("admin-notifications-tourism_admin", "new-internal-message", payload);
    } catch (e) {
      console.error("Pusher trigger failed:", e);
    }

    return NextResponse.json({ success: true, message: "Category credential voluntarily revoked." });
  } catch (error: any) {
    console.error("Failed to revoke category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
