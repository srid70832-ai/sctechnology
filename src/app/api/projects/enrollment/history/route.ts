import { NextRequest, NextResponse } from "next/server";
import { getStudentProjectHistory } from "@/lib/project-lifecycle-service";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const { searchParams } = new URL(req.url);
    const userId = session?.userId || searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ history: [] });
    }

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
