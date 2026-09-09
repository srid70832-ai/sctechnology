import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getProjectBySlug, checkUserSourceCodeAccess } from "@/lib/projects-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const project = await getProjectBySlug(params.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check user session & subscription access
    const session = await getServerSession();
    let hasAccess = false;
    let planName = "Free / Starter Tier";

    if (!project.isPremium) {
      hasAccess = true;
    } else if (session?.userId) {
      const accessCheck = await checkUserSourceCodeAccess(session.userId, session.role);
      hasAccess = accessCheck.hasAccess;
      planName = accessCheck.planName;
    }

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        hasAccess,
        userPlan: planName,
        // Hide full source code package details for locked users
        sourceCodeSnippet: hasAccess ? project.sourceCodeSnippet : "// 🔒 Full source code is available with Plus, Pro, and Career plans (₹399+)\n// Upgrade your plan to access the complete runnable codebase.",
      },
    });
  } catch (error: any) {
    console.error("GET Project Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch project details" }, { status: 500 });
  }
}
