import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { SubmissionItem } from "@/lib/platform-models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const targetType = searchParams.get("type"); // "PROJECT" | "HACKATHON"

    const colRef = collection(db, COLLECTIONS.SUBMISSIONS);
    let q = query(colRef, orderBy("submittedAt", "desc"));

    let snap;
    try {
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }

    let submissions: SubmissionItem[] = [];
    snap.forEach((d) => {
      submissions.push({ id: d.id, ...(d.data() as any) });
    });

    if (status && status !== "ALL") {
      submissions = submissions.filter((s) => s.status === status);
    }

    if (targetType && targetType !== "ALL") {
      submissions = submissions.filter((s) => s.targetType === targetType);
    }

    return NextResponse.json({ success: true, count: submissions.length, submissions });
  } catch (error: any) {
    console.error("Admin GET Submissions Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Submission ID and new status are required." }, { status: 400 });
    }

    const docRef = doc(db, COLLECTIONS.SUBMISSIONS, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const updatePayload = removeUndefinedValues({
      status,
      adminNotes: adminNotes ? String(adminNotes).trim() : null,
      reviewedAt: serverTimestamp(),
      reviewedBy: session?.email || "ADMIN",
    });

    await updateDoc(docRef, updatePayload);

    return NextResponse.json({
      success: true,
      message: `Submission status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error("Admin PATCH Submission Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update submission" }, { status: 500 });
  }
}
