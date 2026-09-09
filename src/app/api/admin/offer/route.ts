import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOfferFromFirestore, saveOfferToFirestore, LimitedOfferConfig } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const offer = await getOfferFromFirestore();
    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    console.error("Admin GET Offer Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch offer configuration" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      enabled,
      title,
      bannerMessage,
      discountPercentage,
      badgeText,
      eligiblePlans,
      startDate,
      endDate,
    } = body;

    const discountNum = Number(discountPercentage);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 99) {
      return NextResponse.json(
        { error: "Discount percentage must be between 1 and 99." },
        { status: 400 }
      );
    }

    const payload: Partial<LimitedOfferConfig> = {
      enabled: Boolean(enabled),
      title: title ? String(title).trim() : "🔥 LIMITED-TIME OFFER",
      bannerMessage: bannerMessage ? String(bannerMessage).trim() : "Get 30% OFF on all plans",
      discountPercentage: discountNum,
      badgeText: badgeText ? String(badgeText).trim() : `🔥 ${discountNum}% OFF`,
      eligiblePlans: Array.isArray(eligiblePlans) && eligiblePlans.length > 0 ? eligiblePlans : ["ALL"],
      startDate: startDate ? String(startDate).trim() : null,
      endDate: endDate ? String(endDate).trim() : null,
    };

    await saveOfferToFirestore(payload);

    return NextResponse.json({
      success: true,
      message: "Limited-time offer settings updated successfully.",
      offer: payload,
    });
  } catch (error: any) {
    console.error("Admin POST Offer Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update offer configuration" },
      { status: 500 }
    );
  }
}
