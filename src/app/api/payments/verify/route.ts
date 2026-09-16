import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { getRazorpayMode, verifyRazorpayPayment } from "@/lib/payment";
import { processReferralConversion } from "@/lib/referrals/service";
import { DEFAULT_PLANS } from "@/lib/plans";

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
    if (!adminDb) return NextResponse.json({ error: "Payment service is unavailable" }, { status: 503 });

    const body = await req.json();
    const { orderId, paymentId, signature, billingCycle = "MONTHLY" } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: "Order ID and Payment ID are required" }, { status: 400 });
    }

    // 1. Verify HMAC-SHA256 signature server-side
    await verifyRazorpayPayment({
      orderId,
      paymentId,
      signature: signature || "",
    });

    // 2. Idempotency Check: Check if payment is already processed
    const payCol = adminDb.collection("payments");
    const snap = await payCol.where("razorpayPaymentId", "==", paymentId).limit(1).get();

    if (!snap.empty && snap.docs[0].data().status === "SUCCESS") {
      const existingPayment = snap.docs[0].data();
      const existingSubscription = await adminDb.collection("subscriptions").doc(uid).get();
      const subscription = existingSubscription.exists ? existingSubscription.data() : null;
      return NextResponse.json({
        success: true,
        message: "Payment already verified and active",
        planId: existingPayment.planId,
        subscription: subscription ? {
          planName: subscription.planName || existingPayment.planId,
          amount: subscription.amount || existingPayment.amount || 0,
          startedAt: subscription.startedAt?.toDate?.()?.toISOString?.() || subscription.startDate?.toDate?.()?.toISOString?.() || subscription.startedAt || subscription.startDate,
          expiresAt: subscription.expiresAt?.toDate?.()?.toISOString?.() || subscription.endDate?.toDate?.()?.toISOString?.() || subscription.expiresAt || subscription.endDate,
          realWorldProjectsAccess: Boolean(subscription.realWorldProjectsAccess),
        } : undefined,
      });
    }

    // 3. Update or create Firestore payment record with SUCCESS status
    const orderSnap = await payCol.where("razorpayOrderId", "==", orderId).limit(1).get();
    if (orderSnap.empty) {
      return NextResponse.json({ error: "Verified payment order was not found" }, { status: 400 });
    }

    const orderData = orderSnap.docs[0].data();
    const planId = String(orderData.planId || "").toUpperCase();
    const verifiedPlan = DEFAULT_PLANS.find((plan) => plan.code === planId);
    if (!verifiedPlan) {
      return NextResponse.json({ error: "Verified payment is not linked to a valid subscription plan" }, { status: 400 });
    }
    const firestorePlanSnap = await adminDb.collection("plans").where("code", "==", planId).limit(1).get();
    const firestorePlan = firestorePlanSnap.empty ? null : firestorePlanSnap.docs[0].data();
    const verifiedPlanPrice = Number(firestorePlan?.priceMonthly ?? verifiedPlan.priceMonthly);
    const verifiedPlanName = String(firestorePlan?.name || verifiedPlan.name);
    const verifiedBillingCycle = orderData.billingCycle || billingCycle;
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (verifiedBillingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    await orderSnap.docs[0].ref.update({
      userId: uid,
      userName,
      userEmail,
      planId,
      billingCycle: orderData.billingCycle || billingCycle,
      razorpayPaymentId: paymentId,
      status: "SUCCESS",
      mode: getRazorpayMode(),
      verifiedAt: new Date(),
      updatedAt: new Date(),
    });

        // Process Referral Conversion for Subscription Purchase
    try {
      const payAmount = orderData.amount || verifiedPlanPrice;
      await processReferralConversion({
        referredUid: uid,
        eventType: "SUBSCRIPTION_PURCHASED",
        amount: payAmount,
        metadata: {
          planId,
          orderId,
          paymentId,
          billingCycle,
        },
      });
    } catch (refErr) {
      console.warn("Referral conversion processing notice:", refErr);
    }

    // 4. Activate Subscription in Cloud Firestore (subscriptions/{subscriptionId})
    if (planId) {
      const targetPlan = planId;
      // Upsert subscription for user
      const subRef = adminDb.collection("subscriptions").doc(uid);
      await subRef.set({
        uid,
        userId: uid,
        planId: targetPlan,
        planName: verifiedPlanName,
        amount: verifiedPlanPrice,
        realWorldProjectsAccess: verifiedPlanPrice >= 399,
        billingCycle: verifiedBillingCycle,
        startedAt: startDate,
        expiresAt: endDate,
        startDate,
        endDate,
        status: "ACTIVE",
        paymentId,
        razorpayOrderId: orderId,
        mode: getRazorpayMode(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      // Update user document role / plan
      const userRef = adminDb.collection("users").doc(uid);
      await userRef.set({
        plan: targetPlan,
        subscriptionStatus: "ACTIVE",
        realWorldProjectsAccess: verifiedPlanPrice >= 399,
        updatedAt: new Date(),
      }, { merge: true });

      // Create confirmation notification in Firestore
      await adminDb.collection("notifications").add({
        userId: uid,
        title: `Welcome to SC TECH ${targetPlan} Plan! 🚀`,
        message: `Your payment was verified in ${getRazorpayMode()} mode. All ${targetPlan} benefits, full-stack projects, and certificates are now unlocked.`,
        type: "PAYMENT",
        read: false,
        link: "/dashboard",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified! Your subscription is now active.",
      planId: planId?.toUpperCase() || "PRO",
      mode: getRazorpayMode(),
      subscription: {
        planName: verifiedPlanName,
        amount: verifiedPlanPrice,
        startedAt: startDate.toISOString(),
        expiresAt: endDate.toISOString(),
        realWorldProjectsAccess: verifiedPlanPrice >= 399,
      },
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
