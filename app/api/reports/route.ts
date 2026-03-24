import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";

// GET - List reports (FR-26, FR-29)
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

    if (role === "tourist") {
      // Tourists only see their own reports
      filter = { reporterId: session.user.id };
    } else if (role === "tourism_admin" || role === "super_admin") {
      // Admins see all, optionally filtered by status
      if (status) filter = { status };
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await Report.find(filter)
      .populate("reporterId", "name email")
      .populate("businessId", "name")
      .populate("reviewedBy", "name")
      .populate("decidedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ reports });
  } catch (error: unknown) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit a report (FR-25)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "tourist") {
      return NextResponse.json(
        { error: "Only tourists can submit reports" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { businessId, reason, description } = await request.json();

    if (!businessId || !reason || !description) {
      return NextResponse.json(
        { error: "Business ID, reason, and description are required" },
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

    return NextResponse.json(
      { message: "Report submitted successfully", report },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
