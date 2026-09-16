import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserProjectTask, calculateStipendEligibility } from "@/lib/project-tasks-service";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(req);
    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null);
    if (!access.hasAccess) return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });

    const projectId = params.id;
    const body = await req.json();
    const { 
      userId: _requestedUserId, 
      taskNumber, 
      githubRepoUrl, 
      githubCommitUrl, 
      demoUrl, 
      explanation, 
      screenshotUrls 
    } = body;

    const userId = session?.userId || "";
    if (!userId || !taskNumber || !explanation) {
      return NextResponse.json(
        { error: "User ID, Task Number, and technical explanation are required." },
        { status: 400 }
      );
    }

    const taskId = `${userId}_${projectId}_${taskNumber}`;
    const docRef = doc(db, "userProjectTasks", taskId);
    const docSnap = await getDoc(docRef);

    const now = new Date().toISOString();
    const submissionData = {
      githubRepoUrl: githubRepoUrl?.trim() || undefined,
      githubCommitUrl: githubCommitUrl?.trim() || undefined,
      demoUrl: demoUrl?.trim() || undefined,
      explanation: explanation.trim(),
      screenshotUrls: screenshotUrls || [],
      submittedAt: now,
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        status: "SUBMITTED",
        submission: submissionData,
        updatedAt: now,
      });
    } else {
      await setDoc(docRef, {
        id: taskId,
        userId,
        projectId,
        taskNumber,
        status: "SUBMITTED",
        submission: submissionData,
        assignedAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: `Task ${taskNumber} submitted successfully for evaluator review!`,
      taskId,
      status: "SUBMITTED",
    });
  } catch (err: any) {
    console.error("POST /api/projects/[id]/tasks/submit error:", err);
    return NextResponse.json({ error: "Failed to submit task" }, { status: 500 });
  }
}
