import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { getAdminReferralDashboard, updateReferralSettings } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let isAdmin = false;

    const authResult = await verifyFirebaseToken(req);
    const cleanEmail = (authResult.email || "").toLowerCase().trim();
    if (
      authResult.success &&
      (authResult.decodedToken?.role === "ADMIN" ||
        authResult.decodedToken?.role === "SUPER_ADMIN" ||
        cleanEmail === "srics2425@gmail.com" ||
        cleanEmail === "admin@sctech.com" ||
        cleanEmail === "superadmin@sctech.com")
    ) {
      isAdmin = true;
    } else {
      const session = await getServerSession(req);
      if (session && (session.role === "ADMIN" || session.role === "SUPER_ADMIN" || session.email === "srics2425@gmail.com" || session.email === "admin@sctech.com")) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const dashboard = await getAdminReferralDashboard();
    return NextResponse.json({ success: true, ...dashboard });
  } catch (err: any) {
    console.error("GET /api/admin/referrals error:", err);
    return NextResponse.json({ error: "Failed to fetch admin referral dashboard" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let adminUid = "";
    let adminEmail = "";
    let isAdmin = false;

    const authResult = await verifyFirebaseToken(req);
    const cleanEmail = (authResult.email || "").toLowerCase().trim();
    if (
      authResult.success &&
      (authResult.decodedToken?.role === "ADMIN" ||
        authResult.decodedToken?.role === "SUPER_ADMIN" ||
        cleanEmail === "srics2425@gmail.com" ||
        cleanEmail === "admin@sctech.com" ||
        cleanEmail === "superadmin@sctech.com")
    ) {
      isAdmin = true;
      adminUid = authResult.uid || "";
      adminEmail = authResult.email || "";
    } else {
      const session = await getServerSession(req);
      if (session && (session.role === "ADMIN" || session.role === "SUPER_ADMIN" || session.email === "srics2425@gmail.com" || session.email === "admin@sctech.com")) {
        isAdmin = true;
        adminUid = session.userId;
        adminEmail = session.email;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: "Settings payload is required" }, { status: 400 });
    }

    const updated = await updateReferralSettings(adminUid, adminEmail, settings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error("POST /api/admin/referrals error:", err);
    return NextResponse.json({ error: "Failed to update referral settings" }, { status: 500 });
  }
}
