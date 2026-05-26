import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Service from "@/models/Service";
import { NextResponse } from "next/server";
import Business from "@/models/Business";

export async function GET(request: Request){
    try{
        
const RegisterBusinessModel = Business.modelName;
        await dbConnect();
    const service = await Service.find().populate("businessId");
    console.log(service)
     return NextResponse.json(
              {
                message: "Service retrieved successfully",
                data: service
              },
              { status: 200 });
   
    }catch(error:any){
        const status = error.status || 500;


        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
            { status: status || 500 } 
        );
    }
    
}