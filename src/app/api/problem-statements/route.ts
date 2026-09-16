import { NextResponse } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { removeUndefinedValues } from "@/lib/firestore";
import { 
  ProblemStatement, 
  generateSlug, 
  DEFAULT_EVALUATION_CRITERIA 
} from "@/lib/problem-statements";

export const dynamic = "force-dynamic";

function toISOStringSafe(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
  }
  if (typeof val?.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (typeof val?.seconds === "number") {
    return new Date(val.seconds * 1000).toISOString();
  }
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function safeParseArray(val: any): string[] {
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      return [val.trim()].filter(Boolean);
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function formatProblemStatementDoc(id: string, data: any): ProblemStatement {
  let evalCriteria = DEFAULT_EVALUATION_CRITERIA;
  try {
    if (data.evaluationCriteria) {
      evalCriteria = typeof data.evaluationCriteria === "string"
        ? JSON.parse(data.evaluationCriteria)
        : data.evaluationCriteria;
    }
  } catch {}

  return {
    id,
    problemStatementId: data.problemStatementId || id,
    slug: data.slug || id,
    title: data.title || "Untitled Problem Statement",
    shortDescription: data.shortDescription || data.description || "",
    fullProblemDescription: data.fullProblemDescription || data.description || data.shortDescription || "",
    background: data.background || "",
    problemCategory: data.problemCategory || "Open Innovation",
    domain: data.domain || "Software Engineering",
    difficulty: (data.difficulty || "MEDIUM").toUpperCase() as any,
    organization: data.organization || "SC TECH Original Challenge",
    organizationType: (data.organizationType || "SC_TECH_ORIGINAL") as any,
    location: data.location || "India / Global",
    targetUsers: data.targetUsers || "",
    existingChallenges: data.existingChallenges || "",
    expectedOutcome: data.expectedOutcome || "",
    proposedSolutionAreas: safeParseArray(data.proposedSolutionAreas),
    requiredSkills: safeParseArray(data.requiredSkills),
    technologySuggestions: safeParseArray(data.technologySuggestions),
    constraints: data.constraints || "",
    eligibility: data.eligibility || "All registered students",
    teamSizeMin: Number(data.teamSizeMin) || 1,
    teamSizeMax: Number(data.teamSizeMax) || 4,
    submissionRequirements: data.submissionRequirements || "GitHub repository + Live URL + Walkthrough Video",
    evaluationCriteria: evalCriteria,
    deadline: data.deadline ? toISOStringSafe(data.deadline) : "",
    sourceUrl: data.sourceUrl || undefined,
    sourceName: data.sourceName || undefined,
    isAiGenerated: Boolean(data.isAiGenerated),
    verificationStatus: (data.verificationStatus || "SC_TECH_ORIGINAL") as any,
    createdBy: data.createdBy || "ADMIN",
    status: (data.status || "PUBLISHED").toUpperCase() as any,
    createdAt: toISOStringSafe(data.createdAt),
    updatedAt: toISOStringSafe(data.updatedAt),
  };
}

/**
 * GET /api/problem-statements
 * Public/students receive PUBLISHED problem statements.
 * Admins receive all statements or filtered by status.
 */
export async function GET(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAuth(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const hackathonId = searchParams.get("hackathonId");
    const domain = searchParams.get("domain");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("[GET /api/problem-statements] Firebase Admin SDK is not initialized.");
      return NextResponse.json({ 
        success: false, 
        error: "Database configuration error. Firebase Admin SDK is not initialized." 
      }, { status: 500 });
    }

    let colRef = adminDb.collection("problemStatements");
    let queryRef: FirebaseFirestore.Query = colRef;

    if (isAdmin && statusParam && statusParam !== "ALL") {
      queryRef = queryRef.where("status", "==", statusParam.toUpperCase());
    } else if (!isAdmin) {
      queryRef = queryRef.where("status", "==", "PUBLISHED");
    }

    if (hackathonId) {
      queryRef = queryRef.where("hackathonId", "==", hackathonId);
    }

    const snap = await queryRef.get();
    let allStatements: ProblemStatement[] = [];
    snap.forEach((docSnap) => {
      allStatements.push(formatProblemStatementDoc(docSnap.id, docSnap.data()));
    });

    // In-memory sort by createdAt descending
    allStatements.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // In-memory filters
    let filtered = allStatements;

    if (domain && domain !== "All") {
      const dLower = domain.toLowerCase();
      filtered = filtered.filter((p) => p.domain?.toLowerCase().includes(dLower));
    }

    if (difficulty && difficulty !== "All") {
      const diffUpper = difficulty.toUpperCase();
      filtered = filtered.filter((p) => p.difficulty === diffUpper);
    }

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
    return NextResponse.json({ 
      success: false, 
      error: error?.message || "Failed to fetch problem statements" 
    }, { status: 500 });
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
    const resolvedFullDesc = fullProblemDescription || resolvedShortDesc || "";

    if (!title?.trim() || !resolvedShortDesc?.trim()) {
      return NextResponse.json(
        { success: false, error: "Problem statement title and summary description are required." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("[POST /api/problem-statements] Firebase Admin SDK is not initialized.");
      return NextResponse.json(
        { success: false, error: "Database configuration error. Firebase Admin SDK is not initialized." },
        { status: 500 }
      );
    }

    const slug = body.slug || generateSlug(title);
    const docId = id || slug;

    const parsedProposedSolutions = safeParseArray(proposedSolutionAreas);
    const parsedRequiredSkills = safeParseArray(requiredSkills);
    const parsedTechSuggestions = safeParseArray(technologySuggestions);
    const parsedEvaluationCriteria = Array.isArray(evaluationCriteria) && evaluationCriteria.length > 0
      ? evaluationCriteria
      : DEFAULT_EVALUATION_CRITERIA;

    const docData = removeUndefinedValues({
      id: docId,
      problemStatementId: docId,
      slug,
      title: String(title).trim(),
      shortDescription: String(resolvedShortDesc).trim(),
      fullProblemDescription: String(resolvedFullDesc).trim(),
      background: background ? String(background).trim() : "",
      problemCategory: problemCategory || "Open Innovation",
      domain: domain || "Software Engineering",
      difficulty: (difficulty || "MEDIUM").toUpperCase(),
      organization: organization || "SC TECH Original Challenge",
      organizationType: organizationType || "SC_TECH_ORIGINAL",
      location: location || "India / Global",
      targetUsers: targetUsers || "",
      existingChallenges: existingChallenges || "",
      expectedOutcome: expectedOutcome || "",
      proposedSolutionAreas: parsedProposedSolutions,
      requiredSkills: parsedRequiredSkills,
      technologySuggestions: parsedTechSuggestions,
      constraints: constraints || "",
      eligibility: eligibility || "All registered students",
      teamSizeMin: Number(teamSizeMin) || 1,
      teamSizeMax: Number(teamSizeMax) || 4,
      submissionRequirements: submissionRequirements || "GitHub repository + Live URL + Walkthrough Video",
      evaluationCriteria: parsedEvaluationCriteria,
      deadline: deadline ? toISOStringSafe(deadline) : "",
      hackathonId: hackathonId || null,
      roundNumber: roundNumber ? Number(roundNumber) : 1,
      createdBy: session?.userId || "ADMIN",
      isAiGenerated: Boolean(isAiGenerated),
      verificationStatus: verificationStatus || "SC_TECH_ORIGINAL",
      sourceUrl: sourceUrl || null,
      sourceName: sourceName || null,
      status: (status || "PUBLISHED").toUpperCase(),
      createdAt: body.createdAt ? toISOStringSafe(body.createdAt) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Authoritative write to Firestore problemStatements collection
    await adminDb.collection("problemStatements").doc(docId).set(docData, { merge: true });

    // Verify document was written
    const verifySnap = await adminDb.collection("problemStatements").doc(docId).get();
    if (!verifySnap.exists) {
      throw new Error("Firestore document write could not be verified.");
    }

    const savedStatement = formatProblemStatementDoc(docId, verifySnap.data());

    return NextResponse.json({
      success: true,
      message: `Problem statement saved successfully as ${savedStatement.status}.`,
      id: docId,
      statement: savedStatement,
      problemStatement: savedStatement,
    });
  } catch (error: any) {
    console.error("POST /api/problem-statements Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save problem statement to database." },
      { status: 500 }
    );
  }
}

