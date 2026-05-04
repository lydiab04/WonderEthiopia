import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

// GET - List businesses
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = session.user.role;

    let filter: Record<string, unknown> = {};

    if (role === "business_owner") {
      // Business owners only see their own businesses
      filter = { ownerId: session.user.id };
    } else if (role === "tourism_admin") {
      // Tourism admins can see everything or apply filters
      filter = status && status !== "all" ? { status } : {};
    } else if (role === "super_admin") {
      // Super admins see all businesses; status filter applied if provided
      filter = status && status !== "all" ? { status } : {};
    } else {
      // Tourists only see approved businesses
      filter = { status: "approved" };
    }

    const businesses = await Business.find(filter)
      .populate("ownerId", "name email")
      .populate("recommendedBy", "name")
      .populate("decidedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ businesses });
  } catch (error: unknown) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import AppNotification from "@/models/Notification";

// POST - Register a new business (FR-03: Public registration form)
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      applicantName,
      applicantEmail,
      name,
      description,
      category,
      location,
      industryDetails,
      permitNumber,
      documents,
      contactPhone,
      contactEmail,
    } = body;

    if (!applicantName || !applicantEmail || !name || !category || !location || !permitNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for existing pending application (Restriction: can't apply while one is pending)
    const existingApplication = await Business.findOne({
      applicantEmail,
      status: { $in: ["pending", "recommended_approve", "recommended_reject"] },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You already have a pending application. Please wait for the final decision." },
        { status: 400 }
      );
    }

    const business = await Business.create({
      applicantName,
      applicantEmail,
      name,
      description,
      category,
      location,
      industryDetails: industryDetails || {},
      permitNumber,
      documents: documents || [],
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || contactEmail || applicantEmail,
      status: "pending",
    });

    // Create Notification for Tourism Admins
    await AppNotification.create({
      recipientRole: "tourism_admin",
      title: "New Business Registration",
      message: `A new ${category} business "${name}" has submitted an application.`,
      type: "business_registration",
      relatedId: business._id,
    });

    return NextResponse.json(
      { message: "Business registration submitted successfully", business },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
