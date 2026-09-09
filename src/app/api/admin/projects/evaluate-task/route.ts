import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, feedback, score, reviewer } = body;

    if (!taskId || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Task ID and valid status ('APPROVED' | 'REJECTED') are required." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "userProjectTasks", taskId);
    const docSnap = await getDoc(docRef);

    const now = new Date().toISOString();
    const evaluation = {
      status,
      score: score !== undefined ? Number(score) : (status === "APPROVED" ? 100 : 40),
      feedback: feedback?.trim() || (status === "APPROVED" ? "Excellent technical implementation." : "Please address requirements."),
      reviewedBy: reviewer || "SC TECH Technical Evaluator",
      reviewedAt: now,
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        status,
        evaluation,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Task evaluated as ${status}.`,
      taskId,
      evaluation,
    });
  } catch (err: any) {
    console.error("POST /api/admin/projects/evaluate-task error:", err);
    return NextResponse.json({ error: "Failed to evaluate task" }, { status: 500 });
  }
}
