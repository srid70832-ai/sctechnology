import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { findStudentCertificates } from "@/lib/certificate-system";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const { searchParams } = new URL(req.url);
    const userId = session?.userId || searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({
        receipts: [],
        letters: [],
        certificates: [],
        codePackages: [],
      });
    }

    // 1. Fetch Receipts
    let receipts: any[] = [];
    try {
      const rSnap = await getDocs(query(collection(db, "paymentReceipts"), where("userId", "==", userId)));
      rSnap.forEach((d) => receipts.push(d.data()));
    } catch (e) {
      console.warn("Could not query receipts:", e);
    }

    // 2. Fetch Letters
    let letters: any[] = [];
    try {
      const lSnap = await getDocs(query(collection(db, "stipendLetters"), where("userId", "==", userId)));
      lSnap.forEach((d) => letters.push(d.data()));
    } catch (e) {
      console.warn("Could not query letters:", e);
    }

    // 3. Fetch Certificates
    let certificates: any[] = [];
    try {
      certificates = await findStudentCertificates(userId);
    } catch (e) {
      console.warn("Could not query certificates:", e);
    }

    // 4. Fetch Code Downloads
    let codePackages: any[] = [];
    try {
      const cSnap = await getDocs(query(collection(db, "projectDownloads"), where("userId", "==", userId)));
      cSnap.forEach((d) => codePackages.push(d.data()));
    } catch (e) {
      console.warn("Could not query code downloads:", e);
    }

    return NextResponse.json({
      success: true,
      receipts,
      letters,
      certificates,
      codePackages,
    });
  } catch (err: any) {
    console.error("GET /api/student/documents error:", err);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}
