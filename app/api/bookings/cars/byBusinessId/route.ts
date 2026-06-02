import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CarBooking from "@/models/CarBooking";
import Car from "@/models/Car";

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    await dbConnect();

    // Find all cars owned by the business
    const cars = await Car.find({
      businessId: params.businessId,
    }).select("_id");

    const carIds = cars.map((car) => car._id);

    // Find bookings for those cars
    const bookings = await CarBooking.find({
      car_id: { $in: carIds },
    })
      .populate("car_id")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Car bookings retrieved successfully",
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}
