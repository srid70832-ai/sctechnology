import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { UserProjectTask } from "@/lib/project-tasks-service";

export const dynamic = "force-dynamic";

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

    const snap = await adminDb.collection("userProjectTasks").get();
    const tasks: UserProjectTask[] = [];

    snap.forEach((d) => {
      const data = d.data();
      tasks.push({
        id: d.id,
        ...data,
      } as UserProjectTask);
    });

    tasks.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.assignedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.assignedAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, count: tasks.length, tasks });
  } catch (error: any) {
    console.error("[ADMIN_TASKS_ERROR] GET error:", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || "Failed to load project tasks" }, { status: 500 });
  }
}
