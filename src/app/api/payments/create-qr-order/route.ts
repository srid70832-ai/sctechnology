import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { createFirestoreDocumentWithToken } from "@/lib/firebase-rest";
import { prisma } from "@/lib/prisma";
import { 
  generateReceiptNumber, 
  generateUpiPayload, 
  createQrDataUrl, 
  getVerifiedPlanAmount 
} from "@/lib/payment-qr";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication: Prioritize Firebase ID Token via Firebase Admin
    const authResult = await verifyFirebaseToken(req);
    let uid = authResult.uid;
    let userEmail = authResult.email || "";
    let userName = authResult.name || "Student";
    const token = authResult.token;

    // Fallback to cookie session if ID token is not present
    if (!uid) {
      const session = await getServerSession();
      if (session) {
        uid = session.userId;
        userEmail = session.email || "";
        userName = session.name || "Student";
      }
    }

    if (!uid) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to continue." },
        { status: 401 }
      );
    }

    // 2. Parse & Verify Amount on Server (never trust client amounts)
    const body = await req.json();
    const { planId, billingCycle = "MONTHLY", hackathonId } = body;

    let amount = 0;
    let planName = "SC TECH Subscription";

    if (planId) {
      const verified = await getVerifiedPlanAmount(planId, billingCycle);
      amount = verified.amount;
      planName = `${verified.name} (${billingCycle})`;

      if (amount <= 0 && planId.toUpperCase() !== "FREE") {
        return NextResponse.json({ error: "Invalid plan price." }, { status: 400 });
      }
    } else if (hackathonId) {
      amount = 35;
      planName = "Hackathon Entry Registration";
    } else {
      return NextResponse.json({ error: "Plan ID or Hackathon ID required." }, { status: 400 });
    }

    // 3. Generate QR and Order Reference
    const orderRef = `SC-${Date.now().toString().slice(-6)}`;
    const receiptNumber = generateReceiptNumber();
    const upiString = generateUpiPayload(amount, orderRef, planName);
    const qrDataUrl = await createQrDataUrl(upiString);

    const paymentPayload = {
      userId: uid,
      userEmail,
      userName,
      orderId: orderRef,
      planId: planId?.toUpperCase() || "PLUS",
      planName,
      billingCycle,
      amount,
      currency: "INR",
      paymentMethod: "QR_UPI",
      status: "PENDING",
      receiptNumber,
      receiptEmailStatus: "PENDING",
      receiptGenerated: false,
      mode: "TEST",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Save Payment Record to Cloud Firestore
    let paymentDocId = orderRef;
    if (token) {
      const docId = await createFirestoreDocumentWithToken(token, "payments", paymentPayload, orderRef);
      if (docId) {
        paymentDocId = docId;
      }
    }

    // 5. Optionally mirror to Prisma database if Prisma user exists
    try {
      const prismaUser = await prisma.user.findFirst({
        where: {
          OR: [{ firebaseUid: uid }, { email: userEmail.toLowerCase() }],
        },
      });

      if (prismaUser) {
        await prisma.payment.create({
          data: {
            userId: prismaUser.id,
            orderId: orderRef,
            amount: amount,
            currency: "INR",
            status: "CREATED",
            gateway: "QR_UPI",
          },
        });
      }
    } catch (prismaErr) {
      console.warn("Prisma payment mirror non-blocking warning:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentDocId,
      orderId: orderRef,
      paymentReference: orderRef,
      qrDataUrl,
      upiString,
      amount,
      planName,
      receiptNumber,
      userEmail,
      userName,
    });
  } catch (error: any) {
    console.error("Create QR Order Error:", error);
    return NextResponse.json({ error: "Failed to generate dynamic QR payment" }, { status: 500 });
  }
}
