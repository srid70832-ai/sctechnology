import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { ProjectEnrollment, getRemainingDays } from "@/lib/project-lifecycle-service";

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

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const snap = await adminDb.collection("projectEnrollments").get();
    const list: ProjectEnrollment[] = [];
    const now = Date.now();

    for (const d of snap.docs) {
      const enr = { id: d.id, ...d.data() } as ProjectEnrollment;
      
      // Real-time server auto-lock check on read
      if (enr.deadline) {
        const dead = new Date(enr.deadline).getTime();
        if (
          now > dead && 
          !["SUBMITTED", "EVALUATION_PENDING", "UNDER_REVIEW", "COMPLETED", "LOCKED"].includes(enr.projectStatus)
        ) {
          enr.projectStatus = "LOCKED";
          await adminDb.collection("projectEnrollments").doc(enr.id).update({
            projectStatus: "LOCKED",
            updatedAt: new Date().toISOString(),
          }).catch(() => undefined);
        }
      }

      list.push({
        ...enr,
        remainingDays: enr.deadline ? getRemainingDays(enr.deadline) : 0,
      });
    }

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({
      success: true,
      count: list.length,
      enrollments: list,
    });
  } catch (err: any) {
    console.error("[ADMIN_ENROLLMENTS_ERROR] GET error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message || "Failed to fetch project enrollments" }, { status: 500 });
  }
}
