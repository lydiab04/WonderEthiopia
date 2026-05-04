import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AppNotification from "@/models/Notification";

// GET - List notifications for the logged-in admin
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    if (role !== "tourism_admin" && role !== "super_admin" && role !== "business_owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const query: any = { recipientRole: role };
    if (role === "business_owner") {
      query.recipientId = userId;
    }

    const notifications = await AppNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { id, relatedId } = body;

    if (!id && !relatedId) {
      return NextResponse.json({ error: "Missing notification reference" }, { status: 400 });
    }

    if (relatedId) {
      // Mark all notifications for this business as read for the current user
      await AppNotification.updateMany(
        { relatedId: relatedId, recipientRole: session.user.role },
        { isRead: true }
      );
      return NextResponse.json({ message: "Notifications updated" });
    }

    const notification = await AppNotification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    return NextResponse.json({ notification });
  } catch (error: unknown) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
