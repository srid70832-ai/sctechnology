import { NextResponse } from "next/server";
import { getOfferFromFirestore, isOfferActive } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const offer = await getOfferFromFirestore();
    const active = isOfferActive(offer);

    return NextResponse.json({
      success: true,
      active,
      offer: active ? offer : { ...offer, enabled: false },
    });
  } catch (error: any) {
    console.error("GET Active Offer Error:", error);
    return NextResponse.json(
      { success: false, active: false, error: "Failed to fetch active offer" },
      { status: 500 }
    );
  }
}