import { NextRequest, NextResponse } from "next/server";
import { 
  saveStudentPaymentDetails, 
  getStudentPaymentDetails 
} from "@/lib/payment-vault-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, 
      studentName, 
      studentEmail, 
      phone, 
      accountHolderName, 
      bankName, 
      accountNumber, 
      ifscCode, 
      upiId 
    } = body;

    if (!userId || !studentName || !accountNumber || !ifscCode) {
      return NextResponse.json(
        { error: "Account Holder Name, Bank Name, Account Number, and IFSC Code are required." },
        { status: 400 }
      );
    }

    const saved = await saveStudentPaymentDetails({
      userId,
      studentName: studentName.trim(),
      studentEmail: (studentEmail || "").trim(),
      phone: (phone || "").trim(),
      accountHolderName: accountHolderName.trim(),
      bankName: (bankName || "Nationalized / Private Bank").trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Payment and bank details securely stored in vault.",
      details: saved,
    });
  } catch (err: any) {
    console.error("POST /api/projects/stipend/details error:", err);
    return NextResponse.json({ error: "Failed to save payment details" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const details = await getStudentPaymentDetails(userId, false);
    return NextResponse.json({
      success: true,
      details,
    });
  } catch (err: any) {
    console.error("GET /api/projects/stipend/details error:", err);
    return NextResponse.json({ error: "Failed to fetch payment details" }, { status: 500 });
  }
}
