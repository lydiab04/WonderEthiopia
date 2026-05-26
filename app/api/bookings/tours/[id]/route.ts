import RoomBooking from "@/models/RoomBooking";
import TourBooking from "@/models/TourBooking";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
         const { id } = await params;
        const result = await TourBooking.findOne({tour_id:id});
        return NextResponse.json(
      {
        message: "Booking retrieved successfully",
        data: result
      },
      { status: 200 }
    );
        
    } catch (error: any) {
        const status = error.status || 500;


        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
            { status: status } 
        );
    }
}