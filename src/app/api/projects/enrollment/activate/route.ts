import { NextRequest, NextResponse } from "next/server";
import { activateProjectForStudent } from "@/lib/project-lifecycle-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      studentId, 
      studentName, 
      studentEmail, 
      projectId, 
      projectSlug, 
      projectTitle, 
      projectCategory, 
      projectDifficulty, 
      duration, 
      isNextProjectActivation 
    } = body;

    if (!studentId || !projectId || !duration) {
      return NextResponse.json(
        { error: "Student ID, Project ID, and Duration are required." },
        { status: 400 }
      );
    }

    const result = await activateProjectForStudent({
      studentId,
      studentName: studentName || "Verified Student",
      studentEmail: studentEmail || "",
      projectId,
      projectSlug: projectSlug || projectId,
      projectTitle: projectTitle || "Real-World Engineering Project",
      projectCategory: projectCategory || "Full Stack Development",
      projectDifficulty: projectDifficulty || "INTERMEDIATE",
      duration,
      isNextProjectActivation: !!isNextProjectActivation,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Project successfully activated!",
      enrollment: result.enrollment,
    });
  } catch (err: any) {
    console.error("POST /api/projects/enrollment/activate error:", err);
    return NextResponse.json({ error: "Failed to activate project" }, { status: 500 });
  }
}
