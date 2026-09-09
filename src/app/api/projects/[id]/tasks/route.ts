import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserProjectTasks } from "@/lib/project-tasks-service";
import { auth as firebaseAuth } from "@/lib/firebase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");

    // Get active user ID (from header, cookie, or query param)
    const userId = queryUserId || req.headers.get("x-user-id") || "default_student_user";

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
