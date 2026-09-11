import { NextRequest, NextResponse } from "next/server";
import { getStudentIdeas, getStudentConnections } from "@/lib/idea-link-service";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const { searchParams } = new URL(req.url);
    const studentId = session?.userId || searchParams.get("studentId") || searchParams.get("userId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const [ideas, connections] = await Promise.all([
      getStudentIdeas(studentId),
      getStudentConnections(studentId),
    ]);

    return NextResponse.json({
      success: true,
      ideas,
      connections,
    });
  } catch (err: any) {
    console.error("GET /api/idea-link/my-ideas error:", err);
    return NextResponse.json({ error: "Failed to fetch student ideas" }, { status: 500 });
  }
}
