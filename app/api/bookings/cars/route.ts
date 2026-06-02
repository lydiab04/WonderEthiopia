import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CarBooking from "@/models/CarBooking";
import { registerPayment } from "../../payments/route";
import Service from "@/models/Service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { pick_up_date, return_date, user_id, car_id, total_price, currency } = body;

        if (!pick_up_date || !return_date || !user_id || !car_id || !total_price) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const existingBooking = await CarBooking.findOne({
            user_id, car_id,
            status: { $nin: ["cancelled", "rejected"] },
        });
        if (existingBooking) {
            return NextResponse.json({ error: "You already have an active booking for this car." }, { status: 400 });
        }

        const service = await Service.findById(car_id);
        if (!service || (service.availability?.quantity ?? 0) <= 0) {
            return NextResponse.json({ error: "This car is currently out of stock/unavailable" }, { status: 400 });
        }

        // Pay first
        let payment;
        try {
            payment = await registerPayment({ user_id, amount: total_price, currency: currency || "ETB" });
        } catch (paymentError: any) {
            console.error("Payment registration failed:", paymentError);
            return NextResponse.json({
                success: false,
                message: "Failed to initialize payment gateway.",
                error: typeof paymentError === 'object' ? JSON.stringify(paymentError) : paymentError.message
            }, { status: 502 });
        }

        // Then decrement
        const updatedCar = await Service.findOneAndUpdate(
            { _id: car_id, "availability.quantity": { $gt: 0 } },
            { $inc: { "availability.quantity": -1 } },
            { new: true }
        );
        if (!updatedCar) {
            throw new Error("Car inventory update failed. Car might be out of stock.");
        }

        const payment_id = payment?._id || payment?.id;
        if (!payment_id) {
            return NextResponse.json({ error: "Payment initiation failed" }, { status: 400 });
        }

        const newBooking = await CarBooking.create({
            user_id, car_id, payment_id,
            pick_up_date: new Date(pick_up_date),
            return_date: new Date(return_date),
            total_price
        });

        return NextResponse.json({
            message: "Booking registered successfully",
            data: newBooking,
            payment_url: payment.toObject ? payment.toObject().check_out_url : payment.check_out_url
        }, { status: 201 });

    } catch (error: any) {
        console.error("🔥 Server Terminal Error:", error);
        return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await CarBooking.find({ user_id: session.user.id }).lean();
        return NextResponse.json({ message: "Bookings retrieved successfully", data: result }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || "Something went wrong" }, { status: error.status || 500 });
    }
}
