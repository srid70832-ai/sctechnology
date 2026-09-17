import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { 
  generatePaymentReceiptId, 
  generateStipendLetterId,
  PaymentReceiptData,
  StipendLetterData
} from "@/lib/payment-documents";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: Request) {
  const authResult = await verifyFirebaseToken(req);
  const adminEmails = ["srics2425@gmail.com", "admin@sctech.com", "superadmin@sctech.com"];

  if (
    authResult.success &&
    (authResult.role === "ADMIN" ||
      authResult.role === "SUPER_ADMIN" ||
      adminEmails.includes(authResult.email || ""))
  ) {
    return { authorized: true, user: authResult };
  }

  const session = await getServerSession(req);
  if (
    session &&
    (session.role === "ADMIN" ||
      session.role === "SUPER_ADMIN" ||
      adminEmails.includes(session.email || ""))
  ) {
    return { authorized: true, user: session };
  }

  return {
    authorized: false,
    errorResponse: NextResponse.json(
      { success: false, error: "Unauthorized. Admin privileges required." },
      { status: authResult.uid || session?.userId ? 403 : 401 }
    ),
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { 
      userId, 
      studentName, 
      studentEmail, 
      projectId, 
      projectName, 
      stipendAmount, 
      tasksCompleted, 
      approvedTasks, 
      transactionReference, 
      paymentMethod 
    } = body;

    if (!userId || !studentName || !stipendAmount) {
      return NextResponse.json(
        { error: "User ID, Student Name, and Stipend Amount are required." },
        { status: 400 }
      );
    }

    const receiptId = generatePaymentReceiptId();
    const letterId = generateStipendLetterId();
    const now = new Date().toISOString();
    const formattedDate = formatDate(now);
    const parsedAmount = Number(stipendAmount);

    // 1. Create Official Payment Receipt Record
    const receiptData: PaymentReceiptData = {
      receiptId,
      userId,
      studentName,
      studentEmail: studentEmail || "student@sctech.in",
      projectName: projectName || "Real-World Engineering Project",
      stipendAmount: parsedAmount,
      tasksCompleted: tasksCompleted || 8,
      approvedTasks: approvedTasks || 8,
      transactionReference: transactionReference?.trim() || `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/SC_TECH`,
      paymentMethod: paymentMethod || "Direct Bank NEFT / IMPS / UPI",
      paymentDate: formattedDate,
      paymentStatus: "PAID",
      organization: "SC TECH",
      organizationAddress: "SC TECH Innovation Labs, India",
      authorizedBy: {
        founder: "Charudeshna",
        coFounder: "Sridharan",
      },
      createdAt: now,
    };

    await adminDb.collection("paymentReceipts").doc(receiptId).set(receiptData);

    // 2. Create Official Stipend & Achievement Letter Record
    const letterData: StipendLetterData = {
      letterId,
      receiptId,
      userId,
      studentName,
      studentEmail: studentEmail || "student@sctech.in",
      projectName: projectName || "Real-World Engineering Project",
      projectDomain: "Software Engineering & Cloud Architecture",
      achievementTitle: "Excellence in Project Milestone Execution",
      tasksCompleted: tasksCompleted || 8,
      approvedTasks: approvedTasks || 8,
      stipendAmount: parsedAmount,
      paymentDate: formattedDate,
      issueDate: formattedDate,
      organization: "SC TECH",
      authorizedBy: {
        founder: "Charudeshna",
        coFounder: "Sridharan",
      },
      createdAt: now,
    };

    await adminDb.collection("stipendLetters").doc(letterId).set(letterData);

    // 3. Create Auditable Stipend Disbursement Entry
    const disbursementPayload = {
      id: receiptId,
      userId,
      studentName,
      studentEmail: studentEmail || "student@sctech.in",
      projectId: projectId || projectName,
      projectName: projectName || "Real-World Project",
      approvedTasks: approvedTasks || 8,
      amount: parsedAmount,
      currency: "INR",
      status: "PAID",
      transactionReference: receiptData.transactionReference,
      paymentMethod: receiptData.paymentMethod,
      approvedBy: (auth.user as any)?.email || (auth.user as any)?.uid || "ADMIN",
      approvedAt: now,
      receiptId,
      letterId,
      createdAt: now,
    };

    await adminDb.collection("stipendDisbursements").doc(receiptId).set(disbursementPayload);

    // 4. Send Student In-App Notification
    try {
      await adminDb.collection("notifications").add({
        userId,
        title: "Stipend Disbursed Successfully! 💰",
        message: `Congratulations! Your project stipend of ₹${parsedAmount.toLocaleString("en-IN")} has been disbursed. Receipt: ${receiptId}.`,
        type: "STIPEND_DISBURSED",
        read: false,
        link: "/my-documents",
        createdAt: new Date(),
      });
    } catch (notifErr) {
      console.warn("[DISBURSE_STIPEND] Notification non-blocking notice:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Stipend of ₹${parsedAmount.toLocaleString("en-IN")} disbursed successfully! Receipt ${receiptId} and Official Letter ${letterId} generated.`,
      receipt: receiptData,
      letter: letterData,
    });
  } catch (err: any) {
    console.error("[DISBURSE_STIPEND_ERROR] POST error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message || "Failed to disburse stipend" }, { status: 500 });
  }
}
