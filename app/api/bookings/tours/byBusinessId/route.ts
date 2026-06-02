import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    await dbConnect();

    const tours = await Service.find({
      businessId: params.businessId,
    }).lean();

    return NextResponse.json(
      {
        success: true,
        message: "Tours retrieved successfully",
        data: tours,
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
