import { NextResponse } from "next/server";
import { requireAdmin, getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { removeUndefinedValues } from "@/lib/firestore";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  ProblemStatement, 
  generateSlug, 
  DEFAULT_EVALUATION_CRITERIA 
} from "@/lib/problem-statements";

export const dynamic = "force-dynamic";

/**
 * Helper to safely parse JSON strings or return arrays
 */
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

/**
 * GET /api/problem-statements
 * Public/students receive PUBLISHED problem statements.
 * Admins receive all statements or filtered by status.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const hackathonId = searchParams.get("hackathonId");
    const domain = searchParams.get("domain");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    const session = await getServerSession(req);
    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";

    const whereClause: any = {};

    if (isAdmin && statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam;
    } else if (!isAdmin) {
      whereClause.status = "PUBLISHED";
    }

    if (hackathonId) {
      whereClause.hackathonId = hackathonId;
    }

    if (domain && domain !== "All") {
      whereClause.domain = { contains: domain };
    }

    if (difficulty && difficulty !== "All") {
      whereClause.difficulty = difficulty.toUpperCase();
    }

    const prismaList = await prisma.problemStatement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const formattedList: ProblemStatement[] = prismaList.map((p: any) => {
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

    // In-memory search filter for broad term matching
    let filtered = formattedList;
    if (search && search.trim()) {
      const qTerm = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(qTerm) ||
          p.shortDescription?.toLowerCase().includes(qTerm) ||
          p.domain?.toLowerCase().includes(qTerm) ||
          p.technologySuggestions?.some((t) => t.toLowerCase().includes(qTerm)) ||
          p.requiredSkills?.some((s) => s.toLowerCase().includes(qTerm)) ||
          p.organization?.toLowerCase().includes(qTerm)
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      statements: filtered,
      problemStatements: filtered,
    });
  } catch (error: any) {
    console.error("GET /api/problem-statements Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch problem statements" }, { status: 500 });
  }
}

/**
 * POST /api/problem-statements
 * Protected: Admin only
 */
export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      id,
      title,
      shortDescription,
      fullProblemDescription,
      background,
      problemCategory,
      domain,
      difficulty,
      organization,
      organizationType,
      location,
      targetUsers,
      existingChallenges,
      expectedOutcome,
      proposedSolutionAreas,
      requiredSkills,
      technologySuggestions,
      constraints,
      eligibility,
      teamSizeMin,
      teamSizeMax,
      submissionRequirements,
      evaluationCriteria,
      deadline,
      hackathonId,
      roundNumber,
      status,
      isAiGenerated,
      verificationStatus,
      sourceUrl,
      sourceName,
    } = body;

    const resolvedShortDesc = shortDescription || body.description || "";
    if (!title || !resolvedShortDesc) {
      return NextResponse.json(
        { error: "Problem statement title and short description are required." },
        { status: 400 }
      );
    }

    const toArray = (v: any): string[] => {
      if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
      if (typeof v === "string") return v.split("\n").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const slug = generateSlug(title);
    const parsedProposedSolutions = toArray(proposedSolutionAreas);
    const parsedRequiredSkills = toArray(requiredSkills);
    const parsedTechSuggestions = toArray(technologySuggestions);
    const parsedEvaluationCriteria = Array.isArray(evaluationCriteria) && evaluationCriteria.length > 0
      ? evaluationCriteria
      : DEFAULT_EVALUATION_CRITERIA;

    const saved = await prisma.problemStatement.upsert({
      where: id ? { id } : { slug },
      update: {
        title: String(title).trim(),
        shortDescription: String(resolvedShortDesc).trim(),
        fullProblemDescription: String(fullProblemDescription || resolvedShortDesc).trim(),
        background: background ? String(background).trim() : null,
        problemCategory: problemCategory || "Open Innovation",
        domain: domain || "Software Engineering",
        difficulty: (difficulty || "MEDIUM").toUpperCase(),
        organization: organization || "SC TECH Original Challenge",
        organizationType: organizationType || "SC_TECH_ORIGINAL",
        location: location || "India / Global",
        targetUsers: targetUsers || null,
        existingChallenges: existingChallenges || null,
        expectedOutcome: expectedOutcome || null,
        proposedSolutionAreas: JSON.stringify(parsedProposedSolutions),
        requiredSkills: JSON.stringify(parsedRequiredSkills),
        technologySuggestions: JSON.stringify(parsedTechSuggestions),
        constraints: constraints || null,
        eligibility: eligibility || "All registered students",
        teamSizeMin: Number(teamSizeMin) || 1,
        teamSizeMax: Number(teamSizeMax) || 4,
        submissionRequirements: submissionRequirements || "GitHub repository + Live URL + Walkthrough Video",
        evaluationCriteria: JSON.stringify(parsedEvaluationCriteria),
        deadline: deadline ? new Date(deadline) : null,
        hackathonId: hackathonId || null,
        roundNumber: roundNumber ? Number(roundNumber) : 1,
        isAiGenerated: Boolean(isAiGenerated),
        verificationStatus: verificationStatus || "SC_TECH_ORIGINAL",
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        status: status || "PUBLISHED",
      },
      create: {
        ...(id ? { id } : {}),
        slug,
        title: String(title).trim(),
        shortDescription: String(resolvedShortDesc).trim(),
        fullProblemDescription: String(fullProblemDescription || resolvedShortDesc).trim(),
        background: background ? String(background).trim() : null,
        problemCategory: problemCategory || "Open Innovation",
        domain: domain || "Software Engineering",
        difficulty: (difficulty || "MEDIUM").toUpperCase(),
        organization: organization || "SC TECH Original Challenge",
        organizationType: organizationType || "SC_TECH_ORIGINAL",
        location: location || "India / Global",
        targetUsers: targetUsers || null,
        existingChallenges: existingChallenges || null,
        expectedOutcome: expectedOutcome || null,
        proposedSolutionAreas: JSON.stringify(parsedProposedSolutions),
        requiredSkills: JSON.stringify(parsedRequiredSkills),
        technologySuggestions: JSON.stringify(parsedTechSuggestions),
        constraints: constraints || null,
        eligibility: eligibility || "All registered students",
        teamSizeMin: Number(teamSizeMin) || 1,
        teamSizeMax: Number(teamSizeMax) || 4,
        submissionRequirements: submissionRequirements || "GitHub repository + Live URL + Walkthrough Video",
        evaluationCriteria: JSON.stringify(parsedEvaluationCriteria),
        deadline: deadline ? new Date(deadline) : null,
        hackathonId: hackathonId || null,
        roundNumber: roundNumber ? Number(roundNumber) : 1,
        createdBy: session?.userId || "ADMIN",
        isAiGenerated: Boolean(isAiGenerated),
        verificationStatus: verificationStatus || "SC_TECH_ORIGINAL",
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        status: status || "PUBLISHED",
      },
    });

    // Optional Firestore sync in background
    try {
      const colRef = collection(db, "problemStatements");
      await addDoc(colRef, removeUndefinedValues({
        id: saved.id,
        title: saved.title,
        slug: saved.slug,
        shortDescription: saved.shortDescription,
        domain: saved.domain,
        difficulty: saved.difficulty,
        organization: saved.organization,
        status: saved.status,
        createdAt: serverTimestamp(),
      }));
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Problem statement saved successfully.",
      id: saved.id,
      statement: saved,
      problemStatement: saved,
    });
  } catch (error: any) {
    console.error("POST /api/problem-statements Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save problem statement" }, { status: 500 });
  }
}

