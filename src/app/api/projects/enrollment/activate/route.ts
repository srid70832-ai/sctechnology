import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";
import { activateProjectServer } from "@/lib/project-activation-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { 
      studentId: _studentId, 
      studentName: _studentName, 
      studentEmail: _studentEmail, 
      projectId, 
      projectSlug, 
      projectTitle, 
      projectCategory, 
      projectDifficulty, 
      duration, 
      isNextProjectActivation 
    } = body;

    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null, projectId);
    if (!access.hasAccess) return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });

    if (!session?.userId || !projectId || !duration) {
      return NextResponse.json(
        { error: "Student ID, Project ID, and Duration are required." },
        { status: 400 }
      );
    }

    if (isNextProjectActivation) {
      return NextResponse.json({ error: "The separate ₹99 next-project activation payment must be completed before activation." }, { status: 402 });
    }

    const result = await activateProjectServer({
      studentId: session.userId,
      studentName: session.name || "Verified Student",
      studentEmail: session.email || "",
      projectId,
      duration,
      planId: access.planCode,
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
