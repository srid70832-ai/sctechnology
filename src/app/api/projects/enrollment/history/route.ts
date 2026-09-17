import { NextRequest, NextResponse } from "next/server";
import { getStudentProjectHistory } from "@/lib/project-lifecycle-service";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to view project history." }, { status: 401 });
    }

    const userId = session.userId;
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
