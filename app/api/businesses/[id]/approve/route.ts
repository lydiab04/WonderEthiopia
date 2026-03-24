import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

// Utility to generate a random password
const generateRandomPassword = (length = 10) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only super admins can approve or reject applications." },
        { status: 403 }
      );
    }

    const { decision, decisionNote } = await request.json();

    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const business = await Business.findById(id);

    if (!business) {
      return NextResponse.json({ error: "Business application not found" }, { status: 404 });
    }

    if (!["recommended_approve", "recommended_reject"].includes(business.status)) {
      return NextResponse.json(
        { error: `Business must be reviewed by a Tourism Admin first. Current status: ${business.status}` },
        { status: 400 }
      );
    }

    business.status = decision;
    business.decisionNote = decisionNote || "";
    business.decidedBy = session.user.id as any;

    if (decision === "approved") {
      // 1. Check if email already exists in User collection
      const existingUser = await User.findOne({ email: business.contactEmail.toLowerCase() });
      if (existingUser) {
        return NextResponse.json({ error: "A user with this contact email already exists. Cannot create business owner account." }, { status: 400 });
      }

      // 2. Generate Credentials
      const plainPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      // 3. Create 'business_owner' User account
      const newOwner = await User.create({
        name: business.applicantName,
        email: business.contactEmail.toLowerCase(),
        password: hashedPassword,
        role: "business_owner",
      });

      // 4. Link business to new owner
      business.ownerId = newOwner._id;
      await business.save();

      // 5. Send Email with Credentials safely with Rollback if it fails
      const emailText = `Hello ${business.applicantName},\n\nYour business application for ${business.name} has been approved!\n\nYou can now log in to your dashboard to manage your business and post services.\n\nHere are your login credentials:\nEmail: ${business.contactEmail.toLowerCase()}\nPassword: ${plainPassword}\n\nPlease change your password as soon as you log in.\n\nWelcome to WondarEthiopia!`;

      try {
        await sendEmail(business.contactEmail, "Business Application Approved - Your Credentials", emailText);
      } catch (emailError: any) {
        // ROLLBACK: Delete the user we just created and revert the business status
        await User.findByIdAndDelete(newOwner._id);
        business.status = "recommended_approve"; // revert to previous state
        business.ownerId = undefined; // Need to tell TS we are unlinking it
        await business.save();

        throw new Error(`Account aborted because email failed to send. Check Google App Password. Reason: ${emailError.message}`);
      }

      return NextResponse.json({
        message: "Business approved. User account created and email sent. ✅",
        business,
      });

    } else { // Rejected
      // Send Rejection Email FIRST
      const emailText = `Hello ${business.applicantName},\n\nWe regret to inform you that your business application for ${business.name} has been rejected.\n\nReason: ${decisionNote || "Please contact support for more details."}\n\nThank you for applying to WondarEthiopia.`;
      await sendEmail(business.contactEmail, "Business Application Status - Action Required", emailText);

      // If email doesn't throw an error, it is safe to persist the rejection
      await business.save();

      return NextResponse.json({
        message: "Business rejected and applicant notified via email. ✅",
        business,
      });
    }

  } catch (error: any) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
