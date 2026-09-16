import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null);
    if (!access.hasAccess) return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });

    const body = await req.json();
    const { 
      enrollmentId, 
      githubRepoUrl, 
      githubCommitUrl, 
      liveDemoUrl, 
      documentationText, 
      architectureNotes, 
      screenshots 
    } = body;

    if (!enrollmentId || !githubRepoUrl || !liveDemoUrl) {
      return NextResponse.json(
        { error: "Enrollment ID, GitHub Repository URL, and Live Demo URL are required." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "projectEnrollments", enrollmentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return NextResponse.json({ error: "Enrollment record not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const submissionData = {
      githubRepoUrl: githubRepoUrl.trim(),
      githubCommitUrl: githubCommitUrl?.trim() || undefined,
      liveDemoUrl: liveDemoUrl.trim(),
      documentationText: documentationText?.trim() || undefined,
      architectureNotes: architectureNotes?.trim() || undefined,
      screenshots: screenshots || [],
      submittedAt: now,
    };

    await updateDoc(docRef, {
      projectStatus: "EVALUATION_PENDING",
      submission: submissionData,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Project submitted successfully for evaluator review!",
      enrollmentId,
      status: "EVALUATION_PENDING",
    });
  } catch (err: any) {
    console.error("POST /api/projects/enrollment/submit error:", err);
    return NextResponse.json({ error: "Failed to submit project" }, { status: 500 });
  }
}
