import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import AppNotification from "@/models/Notification";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json({ error: "No transaction reference provided" }, { status: 400 });
    }

    await dbConnect();

    // Verify with Chapa API
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status === "success" && data.data.status === "success") {
      // Find and update the booking
      const booking = await Booking.findOneAndUpdate(
        { txRef },
        { 
          paymentStatus: "paid",
          status: "confirmed" // Auto-confirm if paid
        },
        { new: true }
      ).populate("userId", "name");

      if (!booking) {
        return NextResponse.json({ error: "Booking not found for this transaction" }, { status: 404 });
      }

      // Notify Business Owner - Now that it's PAID
      await AppNotification.create({
        recipientRole: "business_owner",
        title: "New Paid Reservation",
        message: `A new reservation has been confirmed and paid by ${booking.userId?.name || "a traveler"}.`,
        type: "booking_new",
        relatedId: booking._id,
      });

      return NextResponse.json({ 
        message: "Payment verified successfully", 
        booking 
      });
    } else {
      return NextResponse.json({ 
        error: "Payment verification failed", 
        details: data.message 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
