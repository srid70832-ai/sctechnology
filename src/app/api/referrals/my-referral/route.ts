import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { getUserReferralDashboard, getOrCreateUserReferral } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
      return NextResponse.json({ error: "Unauthorized. Please log in to view referral dashboard." }, { status: 401 });
    }

    const dashboard = await getUserReferralDashboard(uid);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (err: any) {
    console.error("GET /api/referrals/my-referral error:", err);
    return NextResponse.json({ error: "Failed to fetch referral dashboard" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const stats = await getOrCreateUserReferral(uid, name, email);
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error("POST /api/referrals/my-referral error:", err);
    return NextResponse.json({ error: "Failed to initialize referral" }, { status: 500 });
  }
}
