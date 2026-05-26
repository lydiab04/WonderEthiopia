import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        await dbConnect();
        const services=await Service.find();

        return NextResponse.json({ 
            message:'Services fetched',
            services
    });
    }catch(error:any){
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}