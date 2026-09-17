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
    const access = await hasRealWorldProjectsAccess(
      session ? { uid: session.userId, role: session.role } : null,
      params.id
    );

    const isFree =
      access.reason === "FREE_PROJECT" ||
      String(project.accessType || "").toUpperCase() === "FREE" ||
      String(project.accessLevel || "").toUpperCase() === "FREE" ||
      project.isPremium === false;

    const hasAccess = access.hasAccess || isFree;

    return NextResponse.json({
      success: true,
      hasAccess,
      accessType: isFree ? "FREE" : "PRO",
      isFree,
      project: {
        ...project,
        accessType: isFree ? "FREE" : "PRO",
        accessLevel: isFree ? "FREE" : "PREMIUM_399",
        isFree,
        hasAccess,
        userPlan: access.planName,
        sourceCodeSnippet: hasAccess ? project.sourceCodeSnippet : "",
      },
    });
  } catch (error: any) {
    console.error("GET Project Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch project details" }, { status: 500 });
  }
}
