import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { ProjectItem, slugify } from "@/lib/platform-models";
import { notifyIndexNow, publicContentUrl } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

function sanitizeData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

async function verifyAdminAuth(req: Request) {
  const authResult = await verifyFirebaseToken(req);
  const adminEmails = ["srics2425@gmail.com", "admin@sctech.com", "superadmin@sctech.com"];
  
  if (
    authResult.success &&
    (authResult.role === "ADMIN" ||
      authResult.role === "SUPER_ADMIN" ||
      adminEmails.includes(authResult.email || ""))
  ) {
    return { authorized: true, user: authResult };
  }

  // Fallback to cookie session
  const session = await getServerSession(req);
  if (
    session &&
    (session.role === "ADMIN" ||
      session.role === "SUPER_ADMIN" ||
      adminEmails.includes(session.email || ""))
  ) {
    return { authorized: true, user: session };
  }

  return {
    authorized: false,
    errorResponse: NextResponse.json(
      { success: false, error: "Unauthorized. Admin privileges required." },
      { status: authResult.uid || session?.userId ? 403 : 401 }
    ),
  };
}

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const snap = await adminDb.collection("projects").get();
    const projects: ProjectItem[] = [];

    snap.forEach((d) => {
      const data = d.data();
      projects.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      } as ProjectItem);
    });

    projects.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, count: projects.length, projects });
  } catch (error: any) {
    console.error("[ADMIN_PROJECTS_ERROR] GET error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

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
      accessType,
      accessLevel,
    } = body;

    if (!title || !shortDescription || !githubRepoUrl) {
      return NextResponse.json(
        { error: "Title, short description, and GitHub repository URL are required." },
        { status: 400 }
      );
    }

    const resolvedAccessType: "FREE" | "PRO" =
      String(accessType || "").toUpperCase() === "FREE" || String(accessLevel || "").toUpperCase() === "FREE"
        ? "FREE"
        : "PRO";

    const projectSlug = slug || slugify(title);
    const projectId = id || `proj-${projectSlug}-${Date.now().toString().slice(-4)}`;
    const docRef = adminDb.collection("projects").doc(projectId);

    const existingSnap = await docRef.get();
    const isNew = !existingSnap.exists;

    const toArray = (input: any) => {
      if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
      if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const now = new Date().toISOString();
    const rawPayload = {
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
      accessType: resolvedAccessType,
      accessLevel: resolvedAccessType === "FREE" ? "FREE" : "PREMIUM_399",
      isPremium: resolvedAccessType === "PRO",
      updatedAt: now,
      ...(isNew ? { createdAt: now, createdBy: (auth.user as any)?.email || "ADMIN" } : {}),
    };

    const payload = sanitizeData(rawPayload);
    await docRef.set(payload, { merge: true });

    if (payload.status === "PUBLISHED") {
      notifyIndexNow(publicContentUrl("projects", projectSlug));
    }

    return NextResponse.json({
      success: true,
      message: isNew ? "Project created successfully." : "Project updated successfully.",
      projectId,
    });
  } catch (error: any) {
    console.error("[ADMIN_PROJECTS_ERROR] POST error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || "Failed to save project" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) return auth.errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

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

    const docRef = adminDb.collection("projects").doc(id);
    const existingSnap = await docRef.get();

    if (!existingSnap.exists) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Safety check: Check if student enrollments exist for this project
    const enrollmentsSnap = await adminDb
      .collection("projectEnrollments")
      .where("projectId", "==", id)
      .limit(1)
      .get();

    if (!enrollmentsSnap.empty) {
      // Safe Archive: do not destroy student academic/payment lifecycle history
      await docRef.update({
        status: "ARCHIVED",
        updatedAt: new Date().toISOString(),
        archivedBy: (auth.user as any)?.email || "ADMIN",
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: "Project has active student enrollments and has been safely archived instead of deleted.",
      });
    }

    await docRef.delete();
    notifyIndexNow(publicContentUrl("projects", id));

    return NextResponse.json({
      success: true,
      archived: false,
      message: "Project deleted successfully.",
    });
  } catch (error: any) {
    console.error("[ADMIN_PROJECTS_ERROR] DELETE error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || "Failed to delete project" }, { status: 500 });
  }
}
