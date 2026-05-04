import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import AppNotification from "@/models/Notification";
import { sendBookingEmail } from "@/lib/email";

// POST - Create a new booking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { serviceId, startDate, endDate, guests, specialRequests } = body;

    if (!serviceId || !startDate || !guests) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }

    const service = await Service.findById(serviceId).populate("businessId");
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Calculate total price (Simplified: guests * service price)
    // Note: In a real app, logic would differ for hotels (nights) vs tours (per person)
    const totalPrice = (service.price || 0) * (guests || 1);

    if (totalPrice <= 0) {
      return NextResponse.json({ error: "Invalid reservation amount detected." }, { status: 400 });
    }

    const booking = await Booking.create({
      userId: session.user.id,
      serviceId,
      businessId: service.businessId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      guests,
      totalPrice,
      currency: service.currency || "ETB",
      status: "pending",
      paymentStatus: "unpaid",
      specialRequests: specialRequests || "",
    });

    // --- Chapa Payment Initialization ---
    let checkoutUrl = null;
    let txRef = `TRANS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log("Checking Chapa Key presence:");
    if (process.env.CHAPA_SECRET_KEY && !process.env.CHAPA_SECRET_KEY.includes("xxxx")) {
      console.log("Key validated, initiating Chapa...");
      const currency = (service.currency || "ETB").trim().toUpperCase().slice(0, 3);
      const payload = JSON.stringify({
        amount: totalPrice.toString(),
        currency: currency === "USD" ? "USD" : "ETB", 
        email: session.user.email,
        first_name: (session.user.name?.split(" ")[0] || "Guest").replace(/[^a-zA-Z]/g, ""),
        last_name: (session.user.name?.split(" ")[1] || "Explorer").replace(/[^a-zA-Z]/g, ""),
        tx_ref: txRef,
        callback_url: `${process.env.NEXTAUTH_URL}/api/bookings/verify?tx_ref=${txRef}`,
        return_url: `${process.env.NEXTAUTH_URL}/dashboard/bookings?tx_ref=${txRef}`,
        customization: {
          title: "Wondar Ethiopia",
          description: `Booking ${service.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "").slice(0, 20)}`,
        },
      });

      console.log("CHAPA INIT - Sending to Chapa:", payload);

      try {
        const chapaResponse = await fetch("https://api.chapa.co/v1/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: payload,
        });

        const chapaData = await chapaResponse.json();
        console.log("Chapa Direct Response:", chapaData); // ADDED LOGGING

        if (chapaData.status === "success") {
          checkoutUrl = chapaData.data.checkout_url;
          // Update booking with tx_ref
          booking.txRef = txRef;
          await booking.save();
        } else {
          console.error("Chapa API Error Status:", chapaData.message); // ADDED LOGGING
        }
      } catch (chapaError) {
        console.error("Chapa Initialization Network/Parsing Failed:", chapaError);
        // We still create the booking, but without a payment link
      }
    }

    // Notify Traveler (Email)
    try {
      await sendBookingEmail(
        session.user.email as string,
        service.name,
        (service.businessId as any).name,
        new Date(startDate).toLocaleDateString(),
        guests,
        `${service.currency || "ETB"} ${totalPrice.toLocaleString()}`
      );
    } catch (emailError) {
      console.error("Email Notification Failed:", emailError);
      // Non-blocking error
    }

    return NextResponse.json({
      message: "Booking created successfully",
      booking,
      checkoutUrl
    }, { status: 201 });
  } catch (error: any) {
    console.error("Booking Creation Error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

// GET - List bookings for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const role = session.user.role;
    let filter = {};

    if (role === "tourist") {
      filter = { userId: session.user.id };
    } else if (role === "business_owner") {
      const Business = (await import("@/models/Business")).default;
      const business = await Business.findOne({ ownerId: session.user.id });
      if (business) {
        filter = { businessId: business._id };
      } else {
        return NextResponse.json({ bookings: [] });
      }
    } else if (role === "tourism_admin" || role === "super_admin") {
      filter = {}; // Admins see all for reporting
    }

    const bookings = await Booking.find(filter)
      .populate("serviceId", "name price category")
      .populate("businessId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Fetch Bookings Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
