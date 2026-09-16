import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getProjectBySlug } from "@/lib/projects-service";
import { getServerSession } from "@/lib/auth";
import { hasRealWorldProjectsAccess, projectAccessError } from "@/lib/real-world-project-access";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(req);
    const access = await hasRealWorldProjectsAccess(session ? { uid: session.userId, role: session.role } : null);
    if (!access.hasAccess) return NextResponse.json(projectAccessError(access), { status: access.reason === "UNAUTHENTICATED" ? 401 : 403 });

    const projectId = params.id;
    const body = await req.json();
    const userId = session?.userId;
    const userEmail = session?.email || "";

    const project = await getProjectBySlug(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Log download event
    if (userId) {
      try {
        await addDoc(collection(db, "projectDownloads"), {
          userId,
          userEmail: userEmail || "anonymous",
          projectId: project.id,
          projectTitle: project.title,
          downloadedAt: serverTimestamp(),
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        });
      } catch (e) {
        console.warn("Could not log project download:", e);
      }
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      title: project.title,
      sourceCodeFileName: project.sourceCodeFileName || `${project.slug || "sctech-project"}.zip`,
      sourceCodeSnippet: project.sourceCodeSnippet,
      githubUrl: `https://github.com/sctech-org/${project.slug || project.id}`,
    });
  } catch (err: any) {
    console.error("POST /api/projects/[id]/download error:", err);
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}
