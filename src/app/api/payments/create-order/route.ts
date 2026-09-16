import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { createRazorpayOrder, getRazorpayKeyId, getRazorpayMode } from "@/lib/payment";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { DEFAULT_PLANS, getOfferFromFirestore, calculatePlanPrice } from "@/lib/plans";

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

    const body = await req.json();
    const { planId, billingCycle = "MONTHLY", hackathonId } = body;

    let calculatedAmount = 0;
    let originalAmount = 0;
    let planName = "SC TECH Subscription";

    if (planId) {
      // 1. Calculate price securely from Firestore or DEFAULT_PLANS - NEVER trust client amount
      const targetCode = planId.toUpperCase();
      let foundPriceMonthly = 0;
      let foundPriceYearly = 0;

      // Check DEFAULT_PLANS first
      const defaultPlan = DEFAULT_PLANS.find((p) => p.code === targetCode);
      if (defaultPlan) {
        foundPriceMonthly = defaultPlan.priceMonthly;
        foundPriceYearly = defaultPlan.priceYearly;
        planName = `${defaultPlan.name} Plan`;
      }

      // Check Firestore override
      try {
        const colRef = collection(db, "plans");
        const q = query(colRef, where("code", "==", targetCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const pData = snap.docs[0].data();
          foundPriceMonthly = pData.priceMonthly ?? foundPriceMonthly;
          foundPriceYearly = pData.priceYearly ?? foundPriceYearly;
          planName = `${pData.name || defaultPlan?.name || "SC TECH"} Plan`;
        }
      } catch (err) {
        console.warn("Error reading plan from Firestore:", err);
      }

      const basePrice = billingCycle === "YEARLY" ? foundPriceYearly : foundPriceMonthly;
      originalAmount = basePrice;

      // Apply dynamic limited offer discount
      try {
        const offer = await getOfferFromFirestore();
        const priceResult = calculatePlanPrice(basePrice, targetCode, offer);
        calculatedAmount = priceResult.finalPrice;
      } catch (offerErr) {
        console.warn("Error applying offer to order price:", offerErr);
        calculatedAmount = basePrice;
      }

      if (calculatedAmount <= 0 && targetCode !== "FREE") {
        return NextResponse.json({ error: "Invalid plan or free plan does not require payment." }, { status: 400 });
      }
    } else if (hackathonId) {
      // Configurable hackathon entry fee (e.g. ₹35)
      calculatedAmount = 35;
      originalAmount = 35;
      planName = "Hackathon Entry Fee";
    } else {
      return NextResponse.json({ error: "Plan ID or Hackathon ID is required." }, { status: 400 });
    }

    const receipt = `rcpt_${uid.slice(0, 6)}_${Date.now()}`;
    const order = await createRazorpayOrder({
      amount: calculatedAmount,
      receipt,
      notes: {
        userId: uid,
        userName: userName,
        userEmail: userEmail,
        planId: planId || "",
        billingCycle: billingCycle || "MONTHLY",
        hackathonId: hackathonId || "",
        mode: getRazorpayMode(),
      },
    });

    // Save payment record in Cloud Firestore
    try {
      await addDoc(collection(db, "payments"), {
        userId: uid,
        userName: userName,
        userEmail: userEmail,
        planId: planId?.toUpperCase() || "",
        billingCycle: billingCycle || "MONTHLY",
        hackathonId: hackathonId || "",
        razorpayOrderId: order.orderId,
        amount: calculatedAmount,
        currency: "INR",
        status: "CREATED",
        mode: getRazorpayMode(),
        createdAt: serverTimestamp(),
      });
    } catch (dbErr) {
      console.warn("Firestore payment record log error:", dbErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount, // in paise
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      planName,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: "Failed to initialize payment order" }, { status: 500 });
  }
}
