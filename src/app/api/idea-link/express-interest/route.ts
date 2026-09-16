import { NextRequest, NextResponse } from "next/server";
import { createConnectionRequest, getIdeaById } from "@/lib/idea-link-service";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { authorized, session, errorResponse } = await requireAuth(req);
    if (!authorized || !session) return errorResponse;
    const body = await req.json();
    const { ideaId, studentName, studentEmail, companyMatch, companyName, companyIndustry, companyWebsite, studentMessage, message } = body;

    const effCompanyName = companyMatch?.companyName || companyName;
    const effCompanyIndustry = companyMatch?.industry || companyIndustry || "Technology";
    const effCompanyWebsite = companyMatch?.officialWebsite || companyWebsite || "https://sctech.org";
    const effMessage = studentMessage || message || "";

    if (!ideaId || !effCompanyName) {
      return NextResponse.json(
        { error: "Idea ID, student ID, and company name are required." },
        { status: 400 }
      );
    }

    const idea = await getIdeaById(ideaId);

    const connection = await createConnectionRequest({
      ideaId,
      ideaTitle: idea?.title || body.ideaTitle || "Startup Idea",
      studentId: session.userId,
      studentName: studentName || idea?.studentName || session.name || "Profile not completed",
      studentEmail: studentEmail || idea?.studentEmail || session.email,
      companyName: effCompanyName,
      companyIndustry: effCompanyIndustry,
      companyWebsite: effCompanyWebsite,
      message: effMessage,
    });

    return NextResponse.json({
      success: true,
      message: `Connection request submitted for ${effCompanyName}!`,
      connection,
    });
  } catch (err: any) {
    console.error("POST /api/idea-link/express-interest error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit connection interest" }, { status: 500 });
  }
}
