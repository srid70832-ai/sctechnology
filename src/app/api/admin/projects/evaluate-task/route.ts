import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { taskId, status, feedback, score, reviewer } = body;

    if (!taskId || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Task ID and valid status ('APPROVED' | 'REJECTED') are required." },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("userProjectTasks").doc(taskId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Task record not found." }, { status: 404 });
    }

    const taskData = docSnap.data()!;
    const now = new Date().toISOString();
    const evaluation = {
      status,
      score: score !== undefined ? Number(score) : (status === "APPROVED" ? 100 : 40),
      feedback: feedback?.trim() || (status === "APPROVED" ? "Excellent technical execution and code structure." : "Please review requirements and resubmit."),
      reviewedBy: reviewer || (auth.user as any)?.email || "SC TECH Technical Evaluator",
      reviewedAt: now,
    };

    await docRef.update({
      status,
      evaluation,
      updatedAt: now,
    });

    // Notify student about evaluation result
    if (taskData.userId) {
      try {
        await adminDb.collection("notifications").add({
          userId: taskData.userId,
          title: `Project Task #${taskData.taskNumber || ""} Evaluated: ${status === "APPROVED" ? "Approved ✓" : "Revision Requested"}`,
          message: evaluation.feedback,
          type: "TASK_EVALUATION",
          read: false,
          link: `/my-projects/${taskData.projectSlug || taskData.projectId}`,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.warn("[EVALUATE_TASK] Notification non-blocking notice:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Task evaluated as ${status}.`,
      taskId,
      evaluation,
    });
  } catch (err: any) {
    console.error("[ADMIN_EVALUATE_TASK_ERROR] POST error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message || "Failed to evaluate task" }, { status: 500 });
  }
}
