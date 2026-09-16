import { NextResponse } from "next/server";
import { getAdminDb, verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { removeUndefinedValues } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(req);
    let uid = session?.userId;

    if (!uid) {
      const tokenVerification = await verifyFirebaseToken(req);
      if (tokenVerification.success && tokenVerification.uid) {
        uid = tokenVerification.uid;
      }
    }

    const body = await req.json();
    const targetUid = uid || body.uid;

    if (!targetUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    if (adminDb) {
      const cleanedData = removeUndefinedValues({
        ...body,
        uid: targetUid,
        updatedAt: new Date().toISOString(),
      });
      await adminDb.collection("students").doc(targetUid).set(cleanedData, { merge: true });
    }

    return NextResponse.json({ success: true, message: "Onboarding saved successfully" });
  } catch (err: any) {
    console.error("API student onboarding error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save" }, { status: 500 });
  }
}
