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

function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

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
      console.warn("[PAYMENT_QR] Unauthorized request attempt to create QR order");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to continue." },
        { status: 401 }
      );
    }

    // 2. Parse & Verify Amount on Server (never trust client amounts)
    const body = await req.json();
    const { planId, billingCycle = "MONTHLY", hackathonId, projectId, duration } = body;

    let amount = 0;
    let planName = "SC TECH Subscription";
    let productType = "SUBSCRIPTION";
    let targetProductId = "";
    let targetProductTitle = "";

    const { getAdminDb } = await import("@/lib/firebase-admin");
    const adminDb = getAdminDb();

    if (projectId) {
      const { getProjectBySlug } = await import("@/lib/projects-service");
      const project = await getProjectBySlug(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found or invalid." }, { status: 404 });
      }

      targetProductId = project.id || projectId;
      targetProductTitle = project.title || "Real-World Project";
      const projectPrice = project.price ?? (project.accessLevel === "FREE" ? 0 : 299);
      amount = projectPrice;
      planName = `${project.title} — Project Unlock`;
      productType = "PROJECT_PURCHASE";

      if (amount <= 0) {
        return NextResponse.json({ error: "This project is free and does not require payment." }, { status: 400 });
      }
    } else if (hackathonId) {
      const { resolveHackathon } = await import("@/lib/hackathons/resolve-hackathon");
      const hackathon = await resolveHackathon(hackathonId);
      if (!hackathon) {
        return NextResponse.json({ error: "Hackathon not found or invalid." }, { status: 404 });
      }

      const fee = Number(hackathon.registrationFee ?? hackathon.entryFee ?? 0);
      if (fee <= 0) {
        return NextResponse.json({ error: "This hackathon is free and does not require payment." }, { status: 400 });
      }

      if (hackathon.registrationDeadline && new Date() > new Date(hackathon.registrationDeadline)) {
        return NextResponse.json({ error: "Registration deadline has passed for this hackathon." }, { status: 400 });
      }

      targetProductId = hackathon.id || hackathonId;
      targetProductTitle = hackathon.title || "Hackathon";
      productType = "HACKATHON_REGISTRATION";
      amount = fee;
      planName = `${targetProductTitle} — Hackathon Registration`;
    } else if (planId) {
      const verified = await getVerifiedPlanAmount(planId, billingCycle);
      amount = verified.amount;
      targetProductId = planId.toUpperCase();
      targetProductTitle = verified.name;
      planName = `${verified.name} (${billingCycle})`;
      productType = "SUBSCRIPTION";

      if (amount <= 0 && planId.toUpperCase() !== "FREE") {
        return NextResponse.json({ error: "Invalid plan price." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Project ID, Plan ID, or Hackathon ID required." }, { status: 400 });
    }

    // 3. Generate Unique Standardized Reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderRef = `SC-PAY-${dateStr}-${randomSuffix}`;
    const receiptNumber = generateReceiptNumber();

    let customQrImageUrl: string | null = null;
    let upiString = generateUpiPayload(amount, orderRef, planName);

    try {
      if (adminDb) {
        const paymentSettingsDoc = await adminDb.collection("siteSettings").doc("payment").get();
        if (paymentSettingsDoc.exists) {
          const s = paymentSettingsDoc.data()!;
          if (s.isActive !== false) {
            if (s.paymentQrImageUrl && typeof s.paymentQrImageUrl === "string" && s.paymentQrImageUrl.trim()) {
              customQrImageUrl = s.paymentQrImageUrl.trim();
            }
            if (s.paymentUpiLink && typeof s.paymentUpiLink === "string" && s.paymentUpiLink.trim()) {
              const baseUpi = s.paymentUpiLink.trim();
              if (baseUpi.startsWith("upi://pay")) {
                const qIndex = baseUpi.indexOf("?");
                if (qIndex !== -1) {
                  const queryPart = baseUpi.substring(qIndex + 1);
                  const params = new URLSearchParams(queryPart);
                  params.set("am", amount.toFixed(2));
                  params.set("cu", "INR");
                  params.set("tr", orderRef);
                  params.set("tn", `SC TECH ${planName}`);
                  upiString = `upi://pay?${params.toString()}`;
                } else {
                  upiString = `${baseUpi}?am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(orderRef)}&tn=${encodeURIComponent(`SC TECH ${planName}`)}`;
                }
              } else if (baseUpi.includes("@")) {
                const upiId = baseUpi;
                upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("SC TECH")}&am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(orderRef)}&tn=${encodeURIComponent(`SC TECH ${planName}`)}`;
              }
            }
          }
        }
      }
    } catch (settErr) {
      console.warn("[PAYMENT_QR] Payment settings resolution warning:", settErr);
    }

    // Generate per-order dynamic QR code with exact amount and transaction ref
    const qrDataUrl = await createQrDataUrl(upiString);

    const rawPaymentPayload = {
      userId: uid,
      userEmail,
      userName,
      orderId: orderRef,
      referenceId: orderRef,
      productType,
      type: productType,
      productId: targetProductId,
      productTitle: targetProductTitle,
      planId: planId ? String(planId).toUpperCase() : (productType === "SUBSCRIPTION" ? "PLUS" : undefined),
      projectId: projectId || undefined,
      hackathonId: hackathonId || undefined,
      duration: duration || undefined,
      planName,
      billingCycle,
      amount,
      currency: "INR",
      paymentMethod: "UPI_QR",
      method: "UPI_QR",
      status: "PENDING",
      receiptNumber,
      receiptEmailStatus: "PENDING",
      receiptGenerated: false,
      mode: "LIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const paymentPayload = sanitizeFirestoreData(rawPaymentPayload);

    console.log(`[PAYMENT_QR] Creating QR order: ref=${orderRef} uid=${uid} amount=₹${amount} type=${productType} product=${targetProductId}`);

    // 4. Save Payment Record to Cloud Firestore
    let paymentDocId = orderRef;
    if (adminDb) {
      await adminDb.collection("payments").doc(orderRef).set(paymentPayload);
    } else if (token) {
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
      console.warn("[PAYMENT_QR] Prisma payment mirror non-blocking warning:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentDocId,
      orderId: orderRef,
      paymentReference: orderRef,
      qrDataUrl,
      customQrImageUrl,
      upiString,
      amount,
      planName,
      receiptNumber,
      userEmail,
      userName,
    });
  } catch (error: any) {
    console.error("[PAYMENT_QR_ERROR] Failed to generate dynamic QR payment:", error?.message || error, error?.stack);
    return NextResponse.json(
      { error: error?.message || "Failed to generate dynamic QR payment" },
      { status: 500 }
    );
  }
}
