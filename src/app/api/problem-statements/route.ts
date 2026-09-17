import { NextResponse } from "next/server";
import { requireAdmin, getServerSession } from "@/lib/auth";
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
      return val.split("\n").map((s) => s.trim()).filter(Boolean);
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

  const description = data.description || data.shortDescription || "";

  return {
    id,
    problemStatementId: data.problemStatementId || id,
    slug: data.slug || id,
    hackathonId: data.hackathonId || null,
    hackathonTitle: data.hackathonTitle || undefined,
    problemCode: data.problemCode || "PS-01",
    title: data.title || "Untitled Problem Statement",
    category: data.category || data.problemCategory || data.domain || "Technology",
    domain: data.domain || "Software Engineering",
    difficulty: (data.difficulty || "MEDIUM").toUpperCase() as any,
    description,
    shortDescription: data.shortDescription || description,
    fullProblemDescription: data.fullProblemDescription || description,
    background: data.background || "",
    targetUsers: data.targetUsers || "",
    existingChallenges: data.existingChallenges || "",
    expectedOutcome: data.expectedOutcome || "",
    expectedSolution: data.expectedSolution || data.expectedOutcome || "",
    objectives: safeParseArray(data.objectives),
    requirements: safeParseArray(data.requirements),
    proposedSolutionAreas: safeParseArray(data.proposedSolutionAreas || data.requirements),
    requiredSkills: safeParseArray(data.requiredSkills),
    technologySuggestions: safeParseArray(data.technologySuggestions),
    constraints: data.constraints || "",
    eligibility: data.eligibility || "All registered students",
    teamSizeMin: Number(data.teamSizeMin) || 1,
    teamSizeMax: Number(data.teamSizeMax) || 4,
    submissionRequirements: data.submissionRequirements || "GitHub repository + Live URL + Walkthrough Video",
    evaluationCriteria: evalCriteria,
    resources: safeParseArray(data.resources),
    suggestedDeliverables: data.suggestedDeliverables || "",
    organization: data.organization || "SC TECH Original Challenge",
    organizationType: (data.organizationType || "SC_TECH_ORIGINAL") as any,
    location: data.location || "India / Global",
    deadline: data.deadline ? toISOStringSafe(data.deadline) : "",
    sourceUrl: data.sourceUrl || undefined,
    sourceName: data.sourceName || undefined,
    isAiGenerated: Boolean(data.isAiGenerated),
    verificationStatus: (data.verificationStatus || "SC_TECH_ORIGINAL") as any,
    status: (data.status || "PUBLISHED").toUpperCase() as any,
    scheduledReleaseAt: data.scheduledReleaseAt ? toISOStringSafe(data.scheduledReleaseAt) : null,
    publishedAt: data.publishedAt ? toISOStringSafe(data.publishedAt) : null,
    displayOrder: Number(data.displayOrder) || 1,
    createdBy: data.createdBy || "ADMIN",
    updatedBy: data.updatedBy || undefined,
    createdAt: toISOStringSafe(data.createdAt),
    updatedAt: toISOStringSafe(data.updatedAt),
  };
}

/**
 * GET /api/problem-statements
 * Public/students receive ONLY published & released problem statements.
 * Admins receive all statements or filtered by status.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(req);
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
        error: "Database configuration error." 
      }, { status: 500 });
    }

    let colRef = adminDb.collection("problemStatements");
    let queryRef: FirebaseFirestore.Query = colRef;

    if (isAdmin && statusParam && statusParam !== "ALL") {
      queryRef = queryRef.where("status", "==", statusParam.toUpperCase());
    } else if (!isAdmin) {
      // Strictly enforce PUBLISHED for students
      queryRef = queryRef.where("status", "==", "PUBLISHED");
    }

    if (hackathonId && hackathonId !== "ALL") {
      queryRef = queryRef.where("hackathonId", "==", hackathonId);
    }

    const snap = await queryRef.get();
    const now = Date.now();
    let allStatements: ProblemStatement[] = [];

    snap.forEach((docSnap) => {
      const formatted = formatProblemStatementDoc(docSnap.id, docSnap.data());
      
      // For students, filter out future scheduled releases
      if (!isAdmin) {
        if (formatted.scheduledReleaseAt && new Date(formatted.scheduledReleaseAt).getTime() > now) {
          return;
        }
      }

      allStatements.push(formatted);
    });

    // Sort by displayOrder ascending, then createdAt descending
    allStatements.sort((a, b) => {
      if ((a.displayOrder || 99) !== (b.displayOrder || 99)) {
        return (a.displayOrder || 99) - (b.displayOrder || 99);
      }
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // In-memory filters
    let filtered = allStatements;

    if (domain && domain !== "All") {
      const dLower = domain.toLowerCase();
      filtered = filtered.filter((p) => p.domain?.toLowerCase().includes(dLower) || p.category?.toLowerCase().includes(dLower));
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
          p.description?.toLowerCase().includes(qTerm) ||
          p.domain?.toLowerCase().includes(qTerm) ||
          p.category?.toLowerCase().includes(qTerm) ||
          p.problemCode?.toLowerCase().includes(qTerm)
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
      hackathonId,
      hackathonTitle,
      problemCode,
      category,
      domain,
      difficulty,
      description,
      shortDescription,
      fullProblemDescription,
      background,
      targetUsers,
      existingChallenges,
      expectedOutcome,
      expectedSolution,
      objectives,
      requirements,
      proposedSolutionAreas,
      requiredSkills,
      technologySuggestions,
      constraints,
      eligibility,
      teamSizeMin,
      teamSizeMax,
      submissionRequirements,
      evaluationCriteria,
      resources,
      suggestedDeliverables,
      deadline,
      status = "DRAFT",
      scheduledReleaseAt,
      displayOrder,
      isAiGenerated,
      organization,
      organizationType,
      location,
      verificationStatus,
      sourceUrl,
      sourceName,
    } = body;

    const resolvedDesc = description || shortDescription || body.shortDescription || "";

    if (!title?.trim() || !resolvedDesc?.trim()) {
      return NextResponse.json(
        { success: false, error: "Problem statement title and description are required." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: "Database configuration error." },
        { status: 500 }
      );
    }

    const slug = body.slug || generateSlug(title);
    const docId = id || slug;
    const nowIso = new Date().toISOString();

    const parsedObjectives = safeParseArray(objectives);
    const parsedRequirements = safeParseArray(requirements);
    const parsedResources = safeParseArray(resources);
    const parsedSkills = safeParseArray(requiredSkills);
    const parsedTech = safeParseArray(technologySuggestions);
    const parsedProposed = safeParseArray(proposedSolutionAreas);
    const parsedEvalCriteria = Array.isArray(evaluationCriteria) && evaluationCriteria.length > 0
      ? evaluationCriteria
      : DEFAULT_EVALUATION_CRITERIA;

    const finalStatus = String(status).toUpperCase();
    const publishedAt = finalStatus === "PUBLISHED" ? nowIso : (body.publishedAt ? toISOStringSafe(body.publishedAt) : null);
    const resolvedScheduledReleaseAt = finalStatus === "SCHEDULED" && scheduledReleaseAt ? toISOStringSafe(scheduledReleaseAt) : null;

    const docData = removeUndefinedValues({
      id: docId,
      problemStatementId: docId,
      slug,
      hackathonId: hackathonId || null,
      hackathonTitle: hackathonTitle || undefined,
      problemCode: problemCode ? String(problemCode).trim() : "PS-01",
      title: String(title).trim(),
      category: category || domain || "Technology",
      domain: domain || "Software Engineering",
      difficulty: (difficulty || "MEDIUM").toUpperCase(),
      description: String(resolvedDesc).trim(),
      shortDescription: String(resolvedDesc).trim(),
      fullProblemDescription: fullProblemDescription ? String(fullProblemDescription).trim() : String(resolvedDesc).trim(),
      background: background ? String(background).trim() : "",
      targetUsers: targetUsers || "",
      existingChallenges: existingChallenges || "",
      expectedOutcome: expectedOutcome || "",
      expectedSolution: expectedSolution || expectedOutcome || "",
      objectives: parsedObjectives,
      requirements: parsedRequirements,
      proposedSolutionAreas: parsedProposed,
      requiredSkills: parsedSkills,
      technologySuggestions: parsedTech,
      constraints: constraints || "",
      eligibility: eligibility || "All registered students",
      teamSizeMin: Number(teamSizeMin) || 1,
      teamSizeMax: Number(teamSizeMax) || 4,
      submissionRequirements: submissionRequirements || "GitHub repository + Live URL + Walkthrough Video",
      evaluationCriteria: parsedEvalCriteria,
      resources: parsedResources,
      suggestedDeliverables: suggestedDeliverables || "",
      organization: organization || "SC TECH Original Challenge",
      organizationType: organizationType || "SC_TECH_ORIGINAL",
      location: location || "India / Global",
      deadline: deadline ? toISOStringSafe(deadline) : "",
      createdBy: session?.userId || "ADMIN",
      isAiGenerated: Boolean(isAiGenerated),
      verificationStatus: verificationStatus || "SC_TECH_ORIGINAL",
      sourceUrl: sourceUrl || null,
      sourceName: sourceName || null,
      status: finalStatus,
      scheduledReleaseAt: resolvedScheduledReleaseAt,
      publishedAt,
      displayOrder: Number(displayOrder) || 1,
      createdAt: body.createdAt ? toISOStringSafe(body.createdAt) : nowIso,
      updatedAt: nowIso,
    });

    await adminDb.collection("problemStatements").doc(docId).set(docData, { merge: true });

    const verifySnap = await adminDb.collection("problemStatements").doc(docId).get();
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
      { success: false, error: error?.message || "Failed to save problem statement." },
      { status: 500 }
    );
  }
}
