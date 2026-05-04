import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Service from "@/models/Service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const booking = await Booking.findById(id).populate("serviceId").populate("businessId");
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Booking is already paid" }, { status: 400 });
    }

    const service = booking.serviceId as any;
    const business = booking.businessId as any;

    // Initialize Chapa again with a new txRef
    const txRef = `TRANS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const currency = (booking.currency || "ETB").trim().toUpperCase().slice(0, 3);
    const payload = JSON.stringify({
      amount: booking.totalPrice.toString(),
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

    console.log("PAYMENT RESTORE - Sending to Chapa:", payload);

    const chapaResponse = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const chapaData = await chapaResponse.json();
    if (chapaData.status === "success") {
      // Update booking with the NEW txRef
      booking.txRef = txRef;
      await booking.save();
      return NextResponse.json({ checkoutUrl: chapaData.data.checkout_url });
    } else {
      return NextResponse.json({ error: "Failed to initialize payment", details: chapaData.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Payment Restoration Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
