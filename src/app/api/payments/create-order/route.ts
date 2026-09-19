import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { createRazorpayOrder, getRazorpayKeyId, getRazorpayMode } from "@/lib/payment";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { DEFAULT_PLANS, getOfferFromFirestore, calculatePlanPrice } from "@/lib/plans";
import { getProjectBySlug } from "@/lib/projects-service";
import { resolveHackathon } from "@/lib/hackathons/resolve-hackathon";

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
    const { planId, billingCycle = "MONTHLY", hackathonId, projectId, teamId } = body;

    let calculatedAmount = 0;
    let originalAmount = 0;
    let planName = "SC TECH Payment";
    let orderType = "SUBSCRIPTION";
    let targetProjectId = "";
    let targetProjectTitle = "";
    let targetHackathonId = "";
    let targetHackathonTitle = "";

    if (projectId) {
      // Direct Real-World Project Purchase
      const project = await getProjectBySlug(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found or invalid." }, { status: 404 });
      }

      targetProjectId = project.id || projectId;
      targetProjectTitle = project.title || "Real-World Project";
      // Dynamic project price from Firestore / project definition (default ₹299 or ₹399)
      const projectPrice = project.price ?? (project.accessLevel === "FREE" ? 0 : 299);
      calculatedAmount = projectPrice;
      originalAmount = projectPrice;
      planName = `${project.title} — Project Unlock`;
      orderType = "PROJECT_PURCHASE";

      if (calculatedAmount <= 0) {
        return NextResponse.json({ error: "This project is free and does not require payment." }, { status: 400 });
      }
    } else if (hackathonId) {
      // Authoritative Hackathon Registration Fee configured by ADMIN
      const hackathon = await resolveHackathon(hackathonId);
      if (!hackathon) {
        return NextResponse.json({ error: "Hackathon not found or invalid." }, { status: 404 });
      }

      const hackathonFee = Number(hackathon.registrationFee ?? hackathon.entryFee ?? 0);
      if (hackathonFee <= 0) {
        return NextResponse.json({ error: "This hackathon is free to enter and does not require payment." }, { status: 400 });
      }

      if (hackathon.registrationDeadline && new Date() > new Date(hackathon.registrationDeadline)) {
        return NextResponse.json({ error: "Registration deadline has closed for this hackathon." }, { status: 400 });
      }

      targetHackathonId = hackathon.id || hackathonId;
      targetHackathonTitle = hackathon.title || "Hackathon";
      calculatedAmount = hackathonFee;
      originalAmount = hackathonFee;
      planName = `${targetHackathonTitle} — Registration Fee`;
      orderType = "HACKATHON";
    } else if (planId) {
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

      // Apply dynamic limited offer discount for subscriptions ONLY
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
    } else {
      return NextResponse.json({ error: "Project ID, Plan ID, or Hackathon ID is required." }, { status: 400 });
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
        hackathonId: targetHackathonId || hackathonId || "",
        hackathonTitle: targetHackathonTitle || "",
        teamId: teamId || "",
        projectId: targetProjectId || projectId || "",
        projectTitle: targetProjectTitle || "",
        type: orderType,
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
        hackathonId: targetHackathonId || hackathonId || "",
        hackathonTitle: targetHackathonTitle || "",
        teamId: teamId || "",
        projectId: targetProjectId || projectId || "",
        projectTitle: targetProjectTitle || "",
        type: orderType,
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
      amount: order.amount, // in paise: e.g. 5000 paise for ₹50
      amountInINR: calculatedAmount, // in ₹
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      planName,
      hackathonId: targetHackathonId || hackathonId || undefined,
      projectId: targetProjectId || projectId || undefined,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: "Failed to initialize payment order" }, { status: 500 });
  }
}
