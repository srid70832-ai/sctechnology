import { NextRequest, NextResponse } from "next/server";
import { submitIdea } from "@/lib/idea-link-service";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { authorized, session, errorResponse } = await requireAuth(req);
    if (!authorized || !session) return errorResponse;
    const body = await req.json();
    const {
      studentName,
      studentEmail,
      studentCollege,
      studentPhone,
      title,
      description,
      problem,
      solution,
      targetUsers,
      industry,
      technologyUsed,
      businessModel,
      expectedImpact,
      pitchDeckUrl,
      demoUrl,
      githubUrl,
    } = body;

    const effDescription = description || body.summary || body.proposedSolution || body.solution || title;
    const effProblem = problem || body.problemStatement || body.problem_statement || "";
    const effSolution = solution || body.proposedSolution || body.solution_statement || "";

    if (!title || !effProblem || !effSolution || !industry) {
      return NextResponse.json(
        { error: "Title, problem statement, proposed solution, and industry are required." },
        { status: 400 }
      );
    }

    const result = await submitIdea({
      studentId: session.userId,
      studentName: studentName || session.name || "Profile not completed",
      studentEmail: studentEmail || session.email,
      studentCollege,
      studentPhone,
      title,
      description: effDescription,
      problem: effProblem,
      solution: effSolution,
      targetUsers: targetUsers || "Industry professionals and consumers",
      industry,
      technologyUsed: Array.isArray(technologyUsed) ? technologyUsed : [technologyUsed].filter(Boolean),
      businessModel: businessModel || "B2B SaaS / Marketplace",
      expectedImpact: expectedImpact || "Significant operational cost reduction and workflow automation.",
      pitchDeckUrl,
      demoUrl,
      githubUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Startup idea submitted successfully for SC TECH evaluation and industry matching.",
      idea: result.idea,
    });
  } catch (err: any) {
    console.error("POST /api/idea-link/submit error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit idea" }, { status: 500 });
  }
}
