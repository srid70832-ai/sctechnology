import { NextRequest, NextResponse } from "next/server";
import { adminShareCompanyMatches } from "@/lib/idea-link-service";

export async function POST(req: NextRequest) {
  try {
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
      adminName: adminName || "SC TECH Venture Board",
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
