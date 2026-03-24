import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";

// GET - Get single report (Super Admin and Tourism Admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role;

    if (role !== "tourism_admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const report = await Report.findById(id)
      .populate("reporterId", "name email")
      .populate("businessId", "name")
      .populate("reviewedBy", "name")
      .populate("decidedBy", "name");

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update report (FR-27: Tourism Admin reviews, FR-28: Super Admin final decision)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role;

    if (role !== "tourism_admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { action, notes } = body;

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Tourism Admin reviews the report
    if (role === "tourism_admin") {
      if (!["under_review", "dismissed"].includes(action)) {
        return NextResponse.json(
          { error: "Tourism admin can set status to under_review or dismissed" },
          { status: 400 }
        );
      }

      report.status = action;
      report.adminNotes = notes || "";
      report.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
      await report.save();

      return NextResponse.json({
        message: `Report ${action === "under_review" ? "marked for review" : "dismissed"}`,
        report,
      });
    }

    // Super Admin takes final action
    if (role === "super_admin") {
      if (!["action_taken", "dismissed"].includes(action)) {
        return NextResponse.json(
          { error: "Super admin can set status to action_taken or dismissed" },
          { status: 400 }
        );
      }

      report.status = action;
      report.superAdminDecision = notes || "";
      report.decidedBy = new mongoose.Types.ObjectId(session.user.id);
      await report.save();

      return NextResponse.json({
        message: `Report ${action === "action_taken" ? "action taken" : "dismissed"} by super admin`,
        report,
      });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: unknown) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
