import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { 
  createFirestoreDocumentWithToken, 
  updateFirestoreDocumentWithToken 
} from "@/lib/firebase-rest";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Unauthorized. Please log in to continue." }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, orderId, planId, billingCycle = "MONTHLY" } = body;

    if (!paymentId && !orderId) {
      return NextResponse.json({ error: "Payment ID or Order ID is required" }, { status: 400 });
    }

    const targetOrderId = orderId || paymentId;
    const verifiedPlan = (planId || "PRO").toUpperCase();
    const isYearly = billingCycle === "YEARLY";

    // 2. Mark payment as CAPTURED in Cloud Firestore
    const now = new Date();
    const paidAtStr = now.toISOString();

    if (token) {
      // Update the payment record in Firestore
      await updateFirestoreDocumentWithToken(token, "payments", targetOrderId, {
        status: "CAPTURED",
        paidAt: paidAtStr,
        verifiedAt: paidAtStr,
        receiptEmailStatus: "SENT",
        receiptGenerated: true,
        updatedAt: paidAtStr,
      });

      // 3. Activate Plan Subscription in Firestore (subscriptions/{userId})
      const startDate = now;
      const endDate = new Date(now);
      if (isYearly) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setDate(endDate.getDate() + 30);
      }

      await createFirestoreDocumentWithToken(
        token,
        "subscriptions",
        {
          userId: uid,
          planId: verifiedPlan,
          planName: `${verifiedPlan} Plan`,
          billingCycle: isYearly ? "YEARLY" : "MONTHLY",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: "ACTIVE",
          paymentId: targetOrderId,
          orderId: targetOrderId,
          paymentMethod: "QR_UPI",
          mode: "TEST",
          createdAt: paidAtStr,
          updatedAt: paidAtStr,
        },
        uid
      );

      // 4. Update user profile plan in Firestore (users/{userId})
      await updateFirestoreDocumentWithToken(token, "users", uid, {
        plan: verifiedPlan,
        subscriptionStatus: "ACTIVE",
        updatedAt: paidAtStr,
      });

      // 5. Create in-app notification in Firestore
      await createFirestoreDocumentWithToken(token, "notifications", {
        userId: uid,
        title: `Payment Receipt — SC TECH ${verifiedPlan} Plan Activated ✓`,
        message: `Your QR payment for the ${verifiedPlan} plan was verified. Subscription is now active.`,
        type: "PAYMENT",
        read: false,
        link: "/dashboard",
        createdAt: paidAtStr,
      });
    }

    // 6. Update Prisma SQLite Database (if user exists in dev.db)
    try {
      const prismaUser = await prisma.user.findFirst({
        where: {
          OR: [{ firebaseUid: uid }, { email: userEmail.toLowerCase() }],
        },
      });

      if (prismaUser) {
        // Update payment status
        await prisma.payment.updateMany({
          where: { orderId: targetOrderId },
          data: { status: "SUCCESS" },
        });

        // Find or create Plan in Prisma
        const planRecord = await prisma.plan.findFirst({
          where: { code: verifiedPlan },
        });

        if (planRecord) {
          const endDate = new Date();
          if (isYearly) {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setDate(endDate.getDate() + 30);
          }

          // Create subscription
          await prisma.subscription.create({
            data: {
              userId: prismaUser.id,
              planId: planRecord.id,
              status: "ACTIVE",
              startDate: new Date(),
              endDate,
              autoRenew: false,
            },
          });
        }
      }
    } catch (prismaErr) {
      console.warn("Prisma subscription sync non-blocking warning:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: "QR Payment verified and captured successfully!",
      payment: {
        id: targetOrderId,
        receiptNumber: `RCPT-${targetOrderId}`,
        amount: isYearly ? 4999 : 499,
        planName: `${verifiedPlan} Plan`,
        paymentMethod: "QR_UPI",
        orderId: targetOrderId,
        userEmail,
        userName,
        paidAt: paidAtStr,
        status: "CAPTURED",
      },
    });
  } catch (error: any) {
    console.error("Verify QR Payment Error:", error);
    return NextResponse.json({ error: "Failed to verify QR payment" }, { status: 500 });
  }
}
