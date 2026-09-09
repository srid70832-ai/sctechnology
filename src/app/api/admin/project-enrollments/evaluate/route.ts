import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ProjectEnrollment, ProjectEvaluationReport } from "@/lib/project-lifecycle-service";

export async function POST(req: NextRequest) {
  try {
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
      certificateApproved 
    } = body;

    if (!enrollmentId || score === undefined || !status) {
      return NextResponse.json(
        { error: "Enrollment ID, score (0-100), and status are required." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "projectEnrollments", enrollmentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const evaluationData: ProjectEvaluationReport = {
      score: Number(score),
      status,
      strengths: strengths?.trim() || "Clean modular code and solid requirement implementation.",
      weaknesses: weaknesses?.trim() || "Minor edge case validation can be expanded.",
      improvements: improvements?.trim() || "Add automated unit testing pipelines.",
      technicalRemarks: technicalRemarks?.trim() || "Approved by SC TECH Technical Assessment Board.",
      evaluationDocumentUrl: evaluationDocumentUrl || undefined,
      evaluatorName: evaluatorName || "SC TECH Lead Technical Evaluator",
      evaluatorRole: "Principal Systems Architect",
      stipendApproved: !!stipendApproved,
      stipendAmount: Number(stipendAmount) || 0,
      certificateApproved: !!certificateApproved,
      evaluatedAt: now,
    };

    const nextProjectStatus = status === "APPROVED" 
      ? "COMPLETED" 
      : status === "REVISION_REQUIRED" 
      ? "REVISION_REQUIRED" 
      : "EVALUATED";

    await updateDoc(docRef, {
      projectStatus: nextProjectStatus,
      evaluation: evaluationData,
      stipendStatus: stipendApproved ? (stipendAmount > 0 ? "APPROVED" : "NOT_ELIGIBLE") : "NOT_ELIGIBLE",
      stipendAmount: Number(stipendAmount) || 0,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Project evaluation submitted successfully. Status updated to ${nextProjectStatus}.`,
      enrollmentId,
      evaluation: evaluationData,
      projectStatus: nextProjectStatus,
    });
  } catch (err: any) {
    console.error("POST /api/admin/project-enrollments/evaluate error:", err);
    return NextResponse.json({ error: "Failed to evaluate project enrollment" }, { status: 500 });
  }
}
