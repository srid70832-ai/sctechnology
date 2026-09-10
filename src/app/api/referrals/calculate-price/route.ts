import { NextResponse } from "next/server";
import { calculateServerPricing } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { basePrice, referralCode, userId } = await req.json();

    if (typeof basePrice !== "number" || basePrice < 0) {
      return NextResponse.json({ error: "Valid basePrice is required" }, { status: 400 });
    }

    const pricing = await calculateServerPricing({
      basePrice,
      referralCode,
      userId,
    });

    return NextResponse.json({ success: true, ...pricing });
  } catch (err: any) {
    console.error("POST /api/referrals/calculate-price error:", err);
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 });
  }
}
