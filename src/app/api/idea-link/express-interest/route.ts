import { NextRequest, NextResponse } from "next/server";
import { createConnectionRequest, getIdeaById } from "@/lib/idea-link-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ideaId, studentId, studentName, studentEmail, companyMatch, companyName, companyIndustry, companyWebsite, studentMessage, message } = body;

    const effCompanyName = companyMatch?.companyName || companyName;
    const effCompanyIndustry = companyMatch?.industry || companyIndustry || "Technology";
    const effCompanyWebsite = companyMatch?.officialWebsite || companyWebsite || "https://sctech.org";
    const effMessage = studentMessage || message || "";

    if (!ideaId || !studentId || !effCompanyName) {
      return NextResponse.json(
        { error: "Idea ID, student ID, and company name are required." },
        { status: 400 }
      );
    }

    const idea = await getIdeaById(ideaId);

    const connection = await createConnectionRequest({
      ideaId,
      ideaTitle: idea?.title || body.ideaTitle || "Startup Idea",
      studentId,
      studentName: studentName || idea?.studentName || "Student Innovator",
      studentEmail: studentEmail || idea?.studentEmail || "",
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
