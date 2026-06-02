import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { registerPayment } from "../../payments/route";
import EventBooking from "@/models/EventBooking";
import Service from "@/models/Service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { number_of_tickets, user_id, event_id, total_price, currency } = body;

        // 1. Validation
        if (!number_of_tickets || !user_id || !event_id || !total_price) {
            return NextResponse.json({ error: "All fields are required", data: body }, { status: 400 });
        }

        const existingBooking = await EventBooking.findOne({
            user_id, event_id,
            status: { $nin: ["cancelled", "rejected"] },
        });
        if (existingBooking) {
            return NextResponse.json({ error: "You already have an active booking for this event." }, { status: 400 });
        }

        // 2. Check service + availability
        const service = await Service.findById(event_id);
        if (!service) {
            return NextResponse.json({ error: "Event service not found" }, { status: 404 });
        }
        if (service.availability?.isAvailable === false) {
            return NextResponse.json({ error: "This event is currently unavailable." }, { status: 400 });
        }

        // 3. Capacity check
        const maxCapacity = service.availability?.quantity || service.metadata?.eventCapacity || service.metadata?.capacity || 0;
        if (maxCapacity > 0) {
            const existingBookings = await EventBooking.find({ event_id });
            const totalBooked = existingBookings.reduce((sum, b) => sum + (b.number_of_tickets || 0), 0);
            if (totalBooked + number_of_tickets > maxCapacity) {
                return NextResponse.json({ error: `Capacity exceeded. Only ${Math.max(0, maxCapacity - totalBooked)} tickets available.` }, { status: 400 });
            }
        }

        // 4. Payment FIRST
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

        // 5. Payment succeeded — NOW decrement
        const updatedEvent = await Service.findOneAndUpdate(
            { _id: event_id, "availability.quantity": { $gt: 0 } },
            { $inc: { "availability.quantity": -number_of_tickets } },
            { new: true }
        );
        if (!updatedEvent) {
            throw new Error("Event inventory update failed. Event might be out of stock.");
        }

        // 6. Extract payment ID
        const payment_id = payment?._id || payment?.id;
        if (!payment_id) {
            return NextResponse.json({ error: "Payment initiation failed" }, { status: 400 });
        }

        // 7. Create Booking
        const newBooking = await EventBooking.create({
            user_id, event_id, number_of_tickets, payment_id, total_price
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

        const result = await EventBooking.find({ user_id: session.user.id }).lean();
        return NextResponse.json({ message: "Bookings retrieved successfully", data: result }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || "Something went wrong" }, { status: error.status || 500 });
    }
}
