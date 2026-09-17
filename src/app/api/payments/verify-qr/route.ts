import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authResult = await verifyFirebaseToken(req);
    let uid = authResult.uid;
    let userEmail = authResult.email || "";
    let userName = authResult.name || "Student";

    if (!uid) {
      const session = await getServerSession();
      if (session) {
        uid = session.userId;
        userEmail = session.email || "";
        userName = session.name || "Student";
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized. Please log in to continue." }, { status: 401 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { paymentId, orderId } = body;

    const targetId = paymentId || orderId;
    if (!targetId) {
      return NextResponse.json({ error: "Payment ID or Order reference required" }, { status: 400 });
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
        return NextResponse.json({ error: "Payment session not found." }, { status: 404 });
      }
    }

    const payData = payDoc.data()!;
    if (payData.userId !== uid) {
      return NextResponse.json({ error: "Unauthorized access to payment record." }, { status: 403 });
    }

    const status = payData.status || "PENDING";

    // 1. If Payment is Verified and PAID
    if (status === "PAID" || status === "CAPTURED" || status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        paymentStatus: "PAID",
        message: "Payment successfully verified and captured!",
        payment: {
          id: payDoc.id,
          orderId: payData.orderId,
          referenceId: payData.referenceId || payData.orderId,
          receiptNumber: payData.receiptNumber || `RCPT-${payDoc.id.slice(-6)}`,
          amount: payData.amount,
          planName: payData.planName || payData.productTitle || "Purchase",
          productType: payData.productType || payData.type,
          projectId: payData.projectId,
          hackathonId: payData.hackathonId,
          userEmail,
          userName,
          paidAt: payData.paidAt || payData.verifiedAt || new Date().toISOString(),
          status: "PAID",
        },
      });
    }

    // 2. If Payment is under Manual Admin Review
    if (status === "MANUAL_REVIEW") {
      return NextResponse.json({
        success: false,
        paymentStatus: "MANUAL_REVIEW",
        message: "Your payment reference/UTR is currently under verification by SC TECH administration. Access will be unlocked as soon as verified.",
        payment: {
          id: payDoc.id,
          orderId: payData.orderId,
          amount: payData.amount,
          status: "MANUAL_REVIEW",
          utrNumber: payData.utrNumber,
        },
      });
    }

    // 3. Payment still PENDING (Never automatic success on button click)
    return NextResponse.json({
      success: false,
      paymentStatus: "PENDING",
      message: "Payment not yet received or verified on the banking network. Please complete your UPI scan and submit your transaction UTR reference if verification is delayed.",
      payment: {
        id: payDoc.id,
        orderId: payData.orderId,
        amount: payData.amount,
        status: "PENDING",
      },
    });
  } catch (error: any) {
    console.error("Verify QR Payment Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to check payment status" }, { status: 500 });
  }
}
