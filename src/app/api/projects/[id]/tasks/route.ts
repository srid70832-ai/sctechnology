import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserProjectTasks } from "@/lib/project-tasks-service";
import { auth as firebaseAuth } from "@/lib/firebase";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(req);
    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null);
    if (!access.hasAccess) return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });

    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");

    // Get active user ID (from header, cookie, or query param)
    const userId = session?.userId || "";

    const { tasks, stipendSummary } = await getOrCreateUserProjectTasks(userId, projectId);

    return NextResponse.json({
      success: true,
      projectId,
      tasks,
      stipendSummary,
    });
  } catch (err: any) {
    console.error("GET /api/projects/[id]/tasks error:", err);
    return NextResponse.json({ error: "Failed to load project tasks" }, { status: 500 });
  }
}
