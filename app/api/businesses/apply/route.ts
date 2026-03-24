import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import AppNotification from "@/models/Notification";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (!key.startsWith("file_")) {
        data[key] = value;
      }
    });

    const contactEmail = formData.get("contactEmail") as string;
    const applicantName = formData.get("applicantName") as string;

    // Required fields check
    const required = ["applicantName", "name", "category", "contactEmail", "permitNumber"];
    for (const f of required) {
      if (!formData.get(f)) {
        return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 });
      }
    }

    await dbConnect();

    // Re-application restriction
    const existing = await Business.findOne({
      contactEmail: contactEmail,
      status: { $in: ["pending", "recommended_approve", "recommended_reject"] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending application. Please wait for the final decision." },
        { status: 400 }
      );
    }

    // Process files
    const uploadedFilePaths: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure directory exists (just in case)
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    // Extract industry files
    const industryFilesMetadata: any[] = [];
    
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("file_") && value instanceof File) {
        const file = value;
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        const publicUrl = `/uploads/${fileName}`;
        
        uploadedFilePaths.push(publicUrl);
        industryFilesMetadata.push({
          fieldName: key.replace("file_", ""),
          fileName: file.name,
          url: publicUrl
        });
      }
    }

    const industryDetailsBase = data.industryDetails ? JSON.parse(data.industryDetails) : {};
    const finalIndustryDetails = {
      ...industryDetailsBase,
      documents: industryFilesMetadata
    };

    // Create a new business application with "pending" status
    const newBusiness = await Business.create({
      applicantName: applicantName,
      applicantEmail: contactEmail, // Map contactEmail to applicantEmail
      name: data.name,
      description: data.description || "",
      category: data.category,
      location: {
        region: data.region || "",
        city: data.city || "",
        address: data.address || "",
      },
      industryDetails: finalIndustryDetails,
      permitNumber: data.permitNumber,
      contactEmail: contactEmail,
      contactPhone: data.contactPhone || "",
      status: "pending",
      documents: uploadedFilePaths // Main documents array also stores URLs
    });

    // Create a persistent notification record
    await AppNotification.create({
      recipientRole: "tourism_admin",
      title: "New Business Application",
      message: `A new registration for "${newBusiness.name}" (${data.category}) has been submitted.`,
      type: "business_registration",
      relatedId: newBusiness._id,
    });

    // Send real-time notification
    try {
      await pusherServer.trigger("admin-notifications", "new-application", {
        message: `New business application received: ${newBusiness.name}`,
        businessId: newBusiness._id,
      });
    } catch (pusherError) {
      console.error("Pusher error:", pusherError);
    }

    return NextResponse.json(
      { message: "Application submitted successfully.", business: newBusiness },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Application error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
