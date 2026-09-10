import { NextResponse } from "next/server";
import { recordReferralClick } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { referralCode, source = "WEBSITE", targetUrl = "/" } = body;

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const result = await recordReferralClick({
      referralCode,
      source,
      targetUrl,
      ip,
      userAgent,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/referrals/track-click error:", err);
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
