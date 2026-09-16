import { NextRequest, NextResponse } from "next/server";
import { getStudentProjectHistory } from "@/lib/project-lifecycle-service";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null);
    if (!access.hasAccess) return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });
    const { searchParams } = new URL(req.url);
    const userId = session?.userId;

    if (!userId) {
      return NextResponse.json({ history: [] });
    }

    const history = await getStudentProjectHistory(userId);
    return NextResponse.json({
      success: true,
      history,
    });
  } catch (err: any) {
    console.error("GET /api/projects/enrollment/history error:", err);
    return NextResponse.json({ error: "Failed to fetch project history" }, { status: 500 });
  }
}
