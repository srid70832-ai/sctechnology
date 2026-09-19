import { NextRequest, NextResponse } from "next/server";
import { adminReviewIdea } from "@/lib/idea-link-service";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;
    const body = await req.json();
    const { ideaId, status, decision, adminNotes, adminName } = body;
    const effDecision = decision || status;

    if (!ideaId || !effDecision) {
      return NextResponse.json({ error: "ideaId and decision (APPROVED / REJECTED) are required." }, { status: 400 });
    }

    const idea = await adminReviewIdea({
      ideaId,
      decision: effDecision,
      adminNotes,
      adminId: session?.userId,
      adminName: adminName || session?.name || "SC TECH Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Idea ${effDecision === "APPROVED" ? "approved" : "rejected"} successfully.`,
      idea,
    });
  } catch (err: any) {
    console.error("POST /api/admin/idea-link/review error:", err);
    return NextResponse.json({ error: err.message || "Failed to review idea" }, { status: 500 });
  }
}
