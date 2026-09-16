import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { ProjectItem, slugify } from "@/lib/platform-models";
import { notifyIndexNow, publicContentUrl } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const colRef = collection(db, COLLECTIONS.PROJECTS);
    let snap;
    try {
      const q = query(colRef, orderBy("createdAt", "desc"));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }

    const projects: ProjectItem[] = [];
    snap.forEach((d) => {
      projects.push({ id: d.id, ...(d.data() as any) });
    });

    return NextResponse.json({ success: true, count: projects.length, projects });
  } catch (error: any) {
    console.error("Admin GET Projects Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      id,
      title,
      slug,
      shortDescription,
      fullDescription,
      problemStatement,
      requirements,
      features,
      technologyStack,
      difficulty,
      estimatedDuration,
      skillsRequired,
      githubRepoUrl,
      liveDemoUrl,
      documentationUrl,
      bannerUrl,
      startDate,
      deadline,
      submissionMethod,
      googleFormUrl,
      status,
    } = body;

    if (!title || !shortDescription || !githubRepoUrl) {
      return NextResponse.json(
        { error: "Title, short description, and GitHub repository URL are required." },
        { status: 400 }
      );
    }

    const projectSlug = slug || slugify(title);
    const projectId = id || `proj-${projectSlug}-${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);

    const existingSnap = await getDoc(docRef);
    const isNew = !existingSnap.exists();

    const toArray = (input: any) => {
      if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
      if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const payload: Partial<ProjectItem> = {
      id: projectId,
      title: String(title).trim(),
      slug: projectSlug,
      shortDescription: String(shortDescription).trim(),
      fullDescription: fullDescription ? String(fullDescription).trim() : String(shortDescription).trim(),
      problemStatement: problemStatement ? String(problemStatement).trim() : "",
      requirements: toArray(requirements),
      features: toArray(features),
      technologyStack: toArray(technologyStack),
      difficulty: difficulty || "INTERMEDIATE",
      estimatedDuration: estimatedDuration || "2-4 Weeks",
      skillsRequired: toArray(skillsRequired),
      githubRepoUrl: String(githubRepoUrl).trim(),
      liveDemoUrl: liveDemoUrl ? String(liveDemoUrl).trim() : null,
      documentationUrl: documentationUrl ? String(documentationUrl).trim() : null,
      bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
      startDate: startDate ? String(startDate).trim() : null,
      deadline: deadline ? String(deadline).trim() : null,
      submissionMethod: submissionMethod === "GOOGLE_FORM" ? "GOOGLE_FORM" : "WEBSITE",
      googleFormUrl: googleFormUrl ? String(googleFormUrl).trim() : null,
      status: status || "PUBLISHED",
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: session?.email || "ADMIN" } : {}),
    };

    const cleaned = removeUndefinedValues(payload);
    await setDoc(docRef, cleaned, { merge: true });
    if (payload.status === "PUBLISHED") {
      notifyIndexNow(publicContentUrl("projects", projectSlug));
    }

    return NextResponse.json({
      success: true,
      message: isNew ? "Project created successfully." : "Project updated successfully.",
      projectId,
    });
  } catch (error: any) {
    console.error("Admin POST Project Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save project" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Project ID is required for deletion." }, { status: 400 });
    }

    await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));
    notifyIndexNow(publicContentUrl("projects", id));
    return NextResponse.json({ success: true, message: "Project deleted successfully." });
  } catch (error: any) {
    console.error("Admin DELETE Project Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete project" }, { status: 500 });
  }
}
