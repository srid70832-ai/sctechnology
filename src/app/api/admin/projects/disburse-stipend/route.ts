import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { 
  generatePaymentReceiptId, 
  generateStipendLetterId,
  PaymentReceiptData,
  StipendLetterData
} from "@/lib/payment-documents";
import { formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
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

    // 1. Create Official Payment Receipt
    const receiptData: PaymentReceiptData = {
      receiptId,
      userId,
      studentName,
      studentEmail: studentEmail || "student@sctech.in",
      projectName: projectName || "Real-World Engineering Project",
      stipendAmount: Number(stipendAmount),
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

    await setDoc(doc(db, "paymentReceipts", receiptId), receiptData);

    // 2. Create Official Stipend & Achievement Letter
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
      stipendAmount: Number(stipendAmount),
      paymentDate: formattedDate,
      issueDate: formattedDate,
      organization: "SC TECH",
      authorizedBy: {
        founder: "Charudeshna",
        coFounder: "Sridharan",
      },
      createdAt: now,
    };

    await setDoc(doc(db, "stipendLetters", letterId), letterData);

    return NextResponse.json({
      success: true,
      message: `Stipend of ₹${stipendAmount} disbursed successfully! Receipt ${receiptId} and Official Letter ${letterId} generated.`,
      receipt: receiptData,
      letter: letterData,
    });
  } catch (err: any) {
    console.error("POST /api/admin/projects/disburse-stipend error:", err);
    return NextResponse.json({ error: "Failed to disburse stipend" }, { status: 500 });
  }
}
