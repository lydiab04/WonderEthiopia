import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BusinessMessage from "@/models/BusinessMessage";
import { pusherServer } from "@/lib/pusher";

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

    const messages = await BusinessMessage.find({ businessId: id })
      .sort({ createdAt: 1 })
      .limit(100);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["super_admin", "tourism_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    await dbConnect();

    // Fetch business status to capture historical context
    const Business = (await import("@/models/Business")).default;
    const business = await Business.findById(id).select("status");

    const message = await BusinessMessage.create({
      businessId: id,
      businessStatusAtTime: business?.status || "unknown",
      senderId: session.user.id,
      senderName: session.user.name,
      senderRole: session.user.role,
      content,
    });

    // Real-time update via Pusher (Specific Business)
    try {
      await pusherServer.trigger(`business-chat-${id}`, "new-message", message);
      
      // Also trigger a global notification for the role
      const recipientRole = session.user.role === "super_admin" ? "tourism_admin" : "super_admin";
      await pusherServer.trigger(`admin-notifications-${recipientRole}`, "new-internal-message", {
        businessId: id,
        senderName: session.user.name,
        message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      });
    } catch (e) {
      console.error("Pusher trigger failed:", e);
    }

    // Create a notification for the OTHER admin role
    try {
      const recipientRole = session.user.role === "super_admin" ? "tourism_admin" : "super_admin";
      const Business = (await import("@/models/Business")).default;
      const business = await Business.findById(id);
      
      const AppNotification = (await import("@/models/Notification")).default;
      await AppNotification.create({
        recipientRole,
        title: "New Internal Message",
        message: `${session.user.name} sent a message regarding "${business?.name || 'a business'}": "${content.substring(0, 30)}..."`,
        type: "internal_chat",
        relatedId: id,
      });
    } catch (notifyError) {
      console.error("Failed to create chat notification:", notifyError);
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Post message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
