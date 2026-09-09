import { NextRequest, NextResponse } from "next/server";
import { 
  getActiveEnrollmentForStudent, 
  getStudentProjectHistory 
} from "@/lib/project-lifecycle-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ activeEnrollment: null, hasPreviousProjects: false });
    }

    const activeEnrollment = await getActiveEnrollmentForStudent(userId);
    const history = await getStudentProjectHistory(userId);
    const hasPreviousProjects = history.length > 0;

    return NextResponse.json({
      success: true,
      activeEnrollment,
      hasPreviousProjects,
      totalPastProjects: history.length,
    });
  } catch (err: any) {
    console.error("GET /api/projects/enrollment/active error:", err);
    return NextResponse.json({ error: "Failed to check active project status" }, { status: 500 });
  }
}
