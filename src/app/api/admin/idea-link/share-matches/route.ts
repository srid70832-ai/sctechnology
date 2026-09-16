import { NextRequest, NextResponse } from "next/server";
import { adminShareCompanyMatches } from "@/lib/idea-link-service";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;
    const body = await req.json();
    const { ideaId, selectedCompanies, selectedMatches, adminNotes, adminName } = body;
    const matches = selectedCompanies || selectedMatches;

    if (!ideaId || !matches || !Array.isArray(matches)) {
      return NextResponse.json({ error: "ideaId and selected companies array are required." }, { status: 400 });
    }

    const idea = await adminShareCompanyMatches({
      ideaId,
      selectedCompanies: matches,
      adminNotes,
      adminId: session?.userId,
      adminName: adminName || session?.name || "SC TECH Admin",
    });

    return NextResponse.json({
      success: true,
      message: `${matches.length} curated company matches shared with student dashboard!`,
      idea,
    });
  } catch (err: any) {
    console.error("POST /api/admin/idea-link/share-matches error:", err);
    return NextResponse.json({ error: err.message || "Failed to share company matches" }, { status: 500 });
  }
}
