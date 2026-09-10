import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { attributeSignup } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let uid: string | undefined;
    let email: string | undefined;
    let name: string | undefined;

    const authResult = await verifyFirebaseToken(req);
    if (authResult.success && authResult.uid) {
      uid = authResult.uid;
      email = authResult.email;
      name = authResult.name;
    } else {
      const session = await getServerSession(req);
      if (session) {
        uid = session.userId;
        email = session.email;
        name = session.name;
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized. User must be logged in to claim referral." }, { status: 401 });
    }

    const body = await req.json();
    const { referralCode, source = "WEBSITE" } = body;

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const result = await attributeSignup({
      newUserId: uid,
      newUserName: name || email?.split("@")[0] || "Student",
      newUserEmail: email || "",
      referralCode,
      source,
      ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ...result,
      message: "Referral attribution applied successfully!",
    });
  } catch (err: any) {
    console.error("POST /api/referrals/claim error:", err);
    return NextResponse.json({ error: "Failed to claim referral" }, { status: 500 });
  }
}
