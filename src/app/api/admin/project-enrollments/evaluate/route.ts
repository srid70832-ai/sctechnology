import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { ProjectEvaluationReport } from "@/lib/project-lifecycle-service";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { 
      enrollmentId, 
      score, 
      status, 
      strengths, 
      weaknesses, 
      improvements, 
      technicalRemarks, 
      evaluationDocumentUrl, 
      evaluatorName, 
      stipendApproved, 
      stipendAmount, 
      certificateApproved,
      completedTasksCount,
      totalTasksCount,
    } = body;

    if (!enrollmentId || score === undefined || !status) {
      return NextResponse.json(
        { error: "Enrollment ID, score (0-100), and status are required." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 500 });
    }

    const enrRef = adminDb.collection("projectEnrollments").doc(enrollmentId);
    const snap = await enrRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const enrData = snap.data() || {};
    const now = new Date().toISOString();

    // Partial completion allows stipend, but STRICTLY BLOCKS certificate
    const isFullApproval = status === "APPROVED";
    const isPartialCompletion = status === "PARTIALLY_COMPLETED";

    const finalCertificateApproved = isFullApproval ? (certificateApproved !== false) : false;
    const finalStipendApproved = !!stipendApproved && Number(stipendAmount) > 0;
    const finalStipendAmount = finalStipendApproved ? Number(stipendAmount) : 0;

    const evaluationData: ProjectEvaluationReport = {
      score: Number(score),
      status,
      strengths: strengths?.trim() || "Clean modular code and solid requirement implementation.",
      weaknesses: weaknesses?.trim() || "Minor edge case validation can be expanded.",
      improvements: improvements?.trim() || "Add automated unit testing pipelines.",
      technicalRemarks: technicalRemarks?.trim() || "Approved by SC TECH Technical Assessment Board.",
      evaluationDocumentUrl: evaluationDocumentUrl || undefined,
      evaluatorName: evaluatorName || "Charudeshna & Sridharan (SC TECH Technical Board)",
      evaluatorRole: "Principal Systems Architect",
      stipendApproved: finalStipendApproved,
      stipendAmount: finalStipendAmount,
      certificateApproved: finalCertificateApproved,
      evaluatedAt: now,
    };

    let nextProjectStatus: string;
    if (isFullApproval) {
      nextProjectStatus = "COMPLETED";
    } else if (isPartialCompletion) {
      nextProjectStatus = "PARTIALLY_COMPLETED";
    } else if (status === "REVISION_REQUIRED") {
      nextProjectStatus = "REVISION_REQUIRED";
    } else if (status === "REJECTED") {
      nextProjectStatus = "REJECTED";
    } else {
      nextProjectStatus = "EVALUATED";
    }

    await enrRef.set({
      projectStatus: nextProjectStatus,
      evaluation: evaluationData,
      completedTasksCount: completedTasksCount !== undefined ? Number(completedTasksCount) : (isFullApproval ? 8 : (isPartialCompletion ? 4 : 0)),
      totalTasksCount: totalTasksCount !== undefined ? Number(totalTasksCount) : 8,
      stipendStatus: finalStipendApproved ? "APPROVED" : "NOT_ELIGIBLE",
      stipendAmount: finalStipendAmount,
      updatedAt: now,
    }, { merge: true });

    // Sync to Leaderboard (internshipAchievements collection) if stipend is earned or completed
    const studentUid = enrData.studentId || enrData.userId;
    const studentName = enrData.studentName || "Verified Student";
    const studentEmail = enrData.studentEmail || "";
    const projectId = enrData.projectId || enrollmentId;
    const projectTitle = enrData.projectTitle || "Real-World Engineering Project";

    if (studentUid && (finalStipendApproved || isFullApproval)) {
      try {
        const achId = `int-ach-${studentUid}-${projectId}`;
        const achievementDoc = {
          id: achId,
          studentUid,
          studentName,
          studentEmail,
          internshipId: projectId,
          companyName: "SC TECH",
          role: projectTitle,
          duration: `${enrData.durationMonths || 2} Months`,
          stipendAmount: finalStipendAmount,
          stipendCurrency: "INR",
          stipendVerified: finalStipendApproved,
          completionVerified: isFullApproval,
          published: true,
          verifiedBy: evaluatorName || "SC TECH Assessment Board",
          verifiedAt: now,
          createdAt: now,
          updatedAt: now,
        };

        await adminDb.collection("internshipAchievements").doc(achId).set(achievementDoc, { merge: true });
      } catch (achErr) {
        console.warn("Notice: Failed to mirror to internshipAchievements:", achErr);
      }
    }

    // In-app Notification
    if (studentUid) {
      try {
        let msgTitle = "Project Evaluation Completed 📋";
        let msgBody = `Your submission for "${projectTitle}" has been evaluated (Score: ${score}/100).`;
        if (isFullApproval) {
          msgTitle = "Project Approved & Certificate Unlocked! 🎓";
          msgBody = `Congratulations! "${projectTitle}" has been approved with full completion. You can now generate your official certificate and claim your ₹${finalStipendAmount.toLocaleString()} stipend.`;
        } else if (isPartialCompletion) {
          msgTitle = "Partial Project Completion Verified 💼";
          msgBody = `Your partial milestones for "${projectTitle}" have been verified. You have been awarded a performance stipend of ₹${finalStipendAmount.toLocaleString()}.`;
        }

        await prisma.notification.create({
          data: {
            userId: studentUid,
            title: msgTitle,
            message: msgBody,
            type: isFullApproval ? "CERTIFICATE" : "PROJECT",
            link: isFullApproval ? "/my-certificates" : `/my-projects/${enrData.projectSlug || projectId}`,
          },
        });
      } catch {
        // notification log only
      }
    }

    return NextResponse.json({
      success: true,
      message: `Project evaluation submitted successfully. Status updated to ${nextProjectStatus}.`,
      enrollmentId,
      evaluation: evaluationData,
      projectStatus: nextProjectStatus,
    });
  } catch (err: any) {
    console.error("POST /api/admin/project-enrollments/evaluate error:", err);
    return NextResponse.json({ error: "Failed to evaluate project enrollment: " + err.message }, { status: 500 });
  }
}
