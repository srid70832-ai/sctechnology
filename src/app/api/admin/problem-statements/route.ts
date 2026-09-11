import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EVALUATION_CRITERIA, ProblemStatement, generateSlug } from "@/lib/problem-statements";

export const dynamic = "force-dynamic";

function safeParseArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const whereClause: any = {};
    if (statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam;
    }

    const prismaList = await prisma.problemStatement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const list: ProblemStatement[] = prismaList.map((p: any) => {
      let evalCriteria = DEFAULT_EVALUATION_CRITERIA;
      try {
        if (p.evaluationCriteria) {
          evalCriteria = JSON.parse(p.evaluationCriteria);
        }
      } catch {}

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        shortDescription: p.shortDescription,
        fullProblemDescription: p.fullProblemDescription,
        background: p.background || "",
        problemCategory: p.problemCategory,
        domain: p.domain,
        difficulty: p.difficulty as any,
        organization: p.organization,
        organizationType: p.organizationType as any,
        location: p.location,
        targetUsers: p.targetUsers || "",
        existingChallenges: p.existingChallenges || "",
        expectedOutcome: p.expectedOutcome || "",
        proposedSolutionAreas: safeParseArray(p.proposedSolutionAreas),
        requiredSkills: safeParseArray(p.requiredSkills),
        technologySuggestions: safeParseArray(p.technologySuggestions),
        constraints: p.constraints || "",
        eligibility: p.eligibility || "",
        teamSizeMin: p.teamSizeMin,
        teamSizeMax: p.teamSizeMax,
        submissionRequirements: p.submissionRequirements || "",
        evaluationCriteria: evalCriteria,
        deadline: p.deadline ? p.deadline.toISOString() : "",
        sourceUrl: p.sourceUrl || undefined,
        sourceName: p.sourceName || undefined,
        isAiGenerated: p.isAiGenerated,
        verificationStatus: p.verificationStatus as any,
        createdBy: p.createdBy,
        status: p.status as any,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      statements: list,
      problemStatements: list,
    });
  } catch (error: any) {
    console.error("Admin GET /api/admin/problem-statements Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch problem statements" }, { status: 500 });
  }
}
