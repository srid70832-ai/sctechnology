import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserProjectTask, calculateStipendEligibility } from "@/lib/project-tasks-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await req.json();
    const { 
      userId, 
      taskNumber, 
      githubRepoUrl, 
      githubCommitUrl, 
      demoUrl, 
      explanation, 
      screenshotUrls 
    } = body;

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
