import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    const docSnap = await adminDb.collection("siteSettings").doc("payment").get();
    const docData = docSnap.exists ? docSnap.data() : null;
    const data = {
      paymentQrImageUrl: docData?.paymentQrImageUrl || null,
      paymentUpiLink: docData?.paymentUpiLink || "upi://pay?pa=sctech.payments@razorpay&pn=SC%20TECH",
      paymentQrVersion: docData?.paymentQrVersion || "1.0",
      isActive: docData?.isActive !== false,
      updatedAt: docData?.updatedAt || null,
    };

    return NextResponse.json(
      {
        success: true,
        settings: {
          paymentQrImageUrl: data.paymentQrImageUrl || null,
          paymentUpiLink: data.paymentUpiLink || "upi://pay?pa=sctech.payments@razorpay&pn=SC%20TECH",
          paymentQrVersion: data.paymentQrVersion || "1.0",
          isActive: data.isActive !== false,
          updatedAt: data.updatedAt || null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/site-settings/payment error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
