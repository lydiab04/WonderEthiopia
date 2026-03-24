import dbConnect from "../lib/mongodb";
import User from "../models/User";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function seed() {
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

    for (const admin of admins) {
      const existing = await User.findOne({ email: admin.email });
      if (existing) {
        console.log(`User ${admin.email} already exists.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await User.create({
        ...admin,
        password: hashedPassword,
      });
      console.log(`Created ${admin.role}: ${admin.email}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
