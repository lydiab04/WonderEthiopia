import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    const admins = [
      {
        name: "Super Admin",
        email: "superadmin@wondar.com",
        password: "SuperAdmin123!",
        role: "super_admin",
      },
      {
        name: "Tourism Admin",
        email: "tourismadmin@wondar.com",
        password: "TourismAdmin123!",
        role: "tourism_admin",
      },
    ];

    const results = [];

    for (const admin of admins) {
      const existing = await User.findOne({ email: admin.email });
      if (existing) {
        results.push({ email: admin.email, status: "already exists" });
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await User.create({
        ...admin,
        password: hashedPassword,
      });
      results.push({ email: admin.email, status: "created" });
    }

    return NextResponse.json({ message: "Seeding attempt finished", results });
  } catch (error: unknown) {
    console.error("Seeding failed:", error);
    return NextResponse.json({ error: "Seeding failed", details: String(error) }, { status: 500 });
  }
}
