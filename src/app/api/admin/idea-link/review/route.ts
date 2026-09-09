import { NextRequest, NextResponse } from "next/server";
import { adminReviewIdea } from "@/lib/idea-link-service";

export async function POST(req: NextRequest) {
  try {
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
      adminName: adminName || "Charudeshna & Sridharan (SC TECH Venture Board)",
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
