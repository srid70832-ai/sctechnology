import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authResult = await verifyFirebaseToken(req);
    if (!authResult.success || !authResult.uid) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { paymentId, orderId, utrNumber } = body;

    if (!utrNumber || !utrNumber.trim()) {
      return NextResponse.json({ error: "Please provide a valid UTR or Transaction ID." }, { status: 400 });
    }

    const targetId = paymentId || orderId;
    if (!targetId) {
      return NextResponse.json({ error: "Payment reference ID is required." }, { status: 400 });
    }

    // Lookup payment record
    let payDocRef = adminDb.collection("payments").doc(targetId);
    let payDoc = await payDocRef.get();

    if (!payDoc.exists) {
      const qSnap = await adminDb.collection("payments").where("orderId", "==", targetId).limit(1).get();
      if (!qSnap.empty) {
        payDocRef = qSnap.docs[0].ref;
        payDoc = qSnap.docs[0];
      } else {
        return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
      }
    }

    const payData = payDoc.data()!;
    if (payData.userId !== authResult.uid) {
      return NextResponse.json({ error: "Unauthorized access to payment record." }, { status: 403 });
    }

    const nowStr = new Date().toISOString();

    // Update status to MANUAL_REVIEW (Never automatic PAID)
    await payDocRef.update({
      utrNumber: utrNumber.trim(),
      status: "MANUAL_REVIEW",
      submittedAt: nowStr,
      updatedAt: nowStr,
    });

    // Create Admin Notification
    try {
      await adminDb.collection("notifications").add({
        title: "New UPI QR Payment Verification Request",
        message: `Student ${authResult.name || authResult.email} submitted UTR (${utrNumber.trim()}) for ${payData.planName || payData.productTitle || "Purchase"} (₹${payData.amount}).`,
        type: "ADMIN_ALERT",
        read: false,
        link: "/admin/payments",
        createdAt: new Date(),
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: "UTR submitted successfully. Your payment is now under verification by SC TECH administrators.",
      status: "MANUAL_REVIEW",
    });
  } catch (error: any) {
    console.error("Submit UTR Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to submit UTR" }, { status: 500 });
  }
}
