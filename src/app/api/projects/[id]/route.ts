import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getProjectBySlug } from "@/lib/projects-service";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const project = await getProjectBySlug(params.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const session = await getServerSession(req);
    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null);
    if (!access.hasAccess) {
      return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });
    }

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        hasAccess: true,
        userPlan: access.planName,
      },
    });
  } catch (error: any) {
    console.error("GET Project Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch project details" }, { status: 500 });
  }
}
