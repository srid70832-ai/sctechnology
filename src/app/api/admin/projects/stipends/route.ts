import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";

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

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    // 1. Fetch Configured Stipend Rules
    let stipendRules = {
      tier1MinTasks: 8,
      tier1Amount: 5000,
      tier2MinTasks: 6,
      tier2MaxTasks: 7,
      tier2Amount: 1200,
    };

    try {
      const rulesDoc = await adminDb.collection("siteSettings").doc("stipends").get();
      if (rulesDoc.exists) {
        const d = rulesDoc.data()!;
        stipendRules = {
          tier1MinTasks: Number(d.tier1MinTasks ?? 8),
          tier1Amount: Number(d.tier1Amount ?? 5000),
          tier2MinTasks: Number(d.tier2MinTasks ?? 6),
          tier2MaxTasks: Number(d.tier2MaxTasks ?? 7),
          tier2Amount: Number(d.tier2Amount ?? 1200),
        };
      }
    } catch (ruleErr) {
      console.warn("[STIPENDS] Rule resolution notice:", ruleErr);
    }

    // 2. Query user tasks from Cloud Firestore via Admin SDK
    const tasksSnap = await adminDb.collection("userProjectTasks").get();
    const userProjectMap: Record<
      string,
      {
        userId: string;
        projectId: string;
        projectSlug?: string;
        total: number;
        approved: number;
        submitted: number;
        rejected: number;
      }
    > = {};

    tasksSnap.forEach((d) => {
      const t = d.data();
      const userId = t.userId || t.studentId;
      const projectId = t.projectId || t.projectSlug || "general";
      if (!userId) return;

      const key = `${userId}___${projectId}`;
      if (!userProjectMap[key]) {
        userProjectMap[key] = {
          userId,
          projectId,
          projectSlug: t.projectSlug || projectId,
          total: 0,
          approved: 0,
          submitted: 0,
          rejected: 0,
        };
      }

      userProjectMap[key].total += 1;
      const status = String(t.status || "").toUpperCase();
      if (status === "APPROVED" || status === "COMPLETED") {
        userProjectMap[key].approved += 1;
      } else if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
        userProjectMap[key].submitted += 1;
      } else if (status === "REJECTED") {
        userProjectMap[key].rejected += 1;
      }
    });

    // 3. Query Payment Receipts & Disbursement records
    const [receiptsSnap, disbursementsSnap] = await Promise.all([
      adminDb.collection("paymentReceipts").get().catch(() => ({ forEach: () => {} })),
      adminDb.collection("stipendDisbursements").get().catch(() => ({ forEach: () => {} })),
    ]);

    const paidKeys = new Set<string>();
    const receiptMap = new Map<string, any>();

    receiptsSnap.forEach((d: any) => {
      const r = d.data();
      if (r.userId && (r.projectId || r.projectName)) {
        const pKey = `${r.userId}___${r.projectId || r.projectName}`;
        paidKeys.add(pKey);
        receiptMap.set(pKey, r);
      }
    });

    disbursementsSnap.forEach((d: any) => {
      const dis = d.data();
      if (dis.userId && dis.projectId && dis.status === "PAID") {
        paidKeys.add(`${dis.userId}___${dis.projectId}`);
      }
    });

    // 4. Query Student Profiles and Project Details cache for rich metadata
    const candidates: any[] = [];
    const userIds = Array.from(new Set(Object.values(userProjectMap).map((m) => m.userId)));
    const projectIds = Array.from(new Set(Object.values(userProjectMap).map((m) => m.projectId)));

    const [usersDocs, projectsDocs] = await Promise.all([
      Promise.all(userIds.map((uid) => adminDb.collection("users").doc(uid).get().catch(() => null))),
      Promise.all(projectIds.map((pid) => adminDb.collection("projects").doc(pid).get().catch(() => null))),
    ]);

    const userProfileMap = new Map<string, any>();
    usersDocs.forEach((docSnap) => {
      if (docSnap && docSnap.exists) {
        userProfileMap.set(docSnap.id, docSnap.data());
      }
    });

    const projectTitleMap = new Map<string, string>();
    projectsDocs.forEach((docSnap) => {
      if (docSnap && docSnap.exists) {
        projectTitleMap.set(docSnap.id, docSnap.data()?.title || docSnap.id);
      }
    });

    // 5. Evaluate real eligibility based on configured rules
    for (const key of Object.keys(userProjectMap)) {
      const data = userProjectMap[key];
      let stipendAmount = 0;
      let isEligible = false;

      if (data.approved >= stipendRules.tier1MinTasks) {
        stipendAmount = stipendRules.tier1Amount;
        isEligible = true;
      } else if (data.approved >= stipendRules.tier2MinTasks) {
        stipendAmount = stipendRules.tier2Amount;
        isEligible = true;
      }

      if (isEligible) {
        const userProfile = userProfileMap.get(data.userId) || {};
        const projectTitle = projectTitleMap.get(data.projectId) || data.projectId.replace(/-/g, " ").toUpperCase();
        const isPaid = paidKeys.has(key) || paidKeys.has(`${data.userId}___${projectTitle}`);
        const receipt = receiptMap.get(key) || receiptMap.get(`${data.userId}___${projectTitle}`);

        candidates.push({
          userId: data.userId,
          studentName: userProfile.name || userProfile.displayName || "Verified Candidate",
          studentEmail: userProfile.email || "student@sctech.in",
          projectId: data.projectId,
          projectName: projectTitle,
          approvedTasks: data.approved,
          totalTasks: Math.max(data.total, 8),
          stipendAmount,
          bankDetailsSubmitted: true,
          paymentStatus: isPaid ? "PAID" : "PENDING",
          receiptId: receipt?.receiptId || null,
        });
      }
    }

    candidates.sort((a, b) => {
      if (a.paymentStatus === b.paymentStatus) {
        return b.approvedTasks - a.approvedTasks;
      }
      return a.paymentStatus === "PENDING" ? -1 : 1;
    });

    return NextResponse.json({
      success: true,
      count: candidates.length,
      rules: stipendRules,
      candidates,
    });
  } catch (error: any) {
    console.error("[ADMIN_STIPENDS_ERROR] GET error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || "Failed to load stipend candidates" }, { status: 500 });
  }
}
