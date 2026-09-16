import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { removeUndefinedValues } from "@/lib/firestore";
import { DEFAULT_EVALUATION_CRITERIA, ProblemStatement } from "@/lib/problem-statements";

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

async function findDocByIdOrSlug(adminDb: FirebaseFirestore.Firestore, idOrSlug: string) {
  const directDoc = await adminDb.collection("problemStatements").doc(idOrSlug).get();
  if (directDoc.exists) {
    return { id: directDoc.id, data: directDoc.data() };
  }

  const slugSnap = await adminDb.collection("problemStatements").where("slug", "==", idOrSlug).limit(1).get();
  if (!slugSnap.empty) {
    const d = slugSnap.docs[0];
    return { id: d.id, data: d.data() };
  }

  return null;
}

/**
 * GET /api/problem-statements/[id]
 * Public / Student / Admin retrieval of a problem statement
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database configuration error." }, { status: 500 });
    }

    const found = await findDocByIdOrSlug(adminDb, params.id);
    if (!found) {
      return NextResponse.json({ success: false, error: "Problem statement not found" }, { status: 404 });
    }

    const statement = formatProblemStatementDoc(found.id, found.data);

    return NextResponse.json({
      success: true,
      statement,
      problemStatement: statement,
    });
  } catch (error: any) {
    console.error("GET /api/problem-statements/[id] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch problem statement" }, { status: 500 });
  }
}

/**
 * PUT / PATCH /api/problem-statements/[id]
 * Protected: Admin only
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database configuration error." }, { status: 500 });
    }

    const found = await findDocByIdOrSlug(adminDb, params.id);
    if (!found) {
      return NextResponse.json({ success: false, error: "Problem statement not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.shortDescription !== undefined || body.description !== undefined) {
      updateData.shortDescription = String(body.shortDescription || body.description).trim();
    }
    if (body.fullProblemDescription !== undefined) updateData.fullProblemDescription = String(body.fullProblemDescription).trim();
    if (body.background !== undefined) updateData.background = body.background ? String(body.background).trim() : "";
    if (body.problemCategory !== undefined) updateData.problemCategory = body.problemCategory;
    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.difficulty !== undefined) updateData.difficulty = String(body.difficulty).toUpperCase();
    if (body.organization !== undefined) updateData.organization = body.organization;
    if (body.organizationType !== undefined) updateData.organizationType = body.organizationType;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.targetUsers !== undefined) updateData.targetUsers = body.targetUsers;
    if (body.existingChallenges !== undefined) updateData.existingChallenges = body.existingChallenges;
    if (body.expectedOutcome !== undefined) updateData.expectedOutcome = body.expectedOutcome;
    if (body.proposedSolutionAreas !== undefined) updateData.proposedSolutionAreas = safeParseArray(body.proposedSolutionAreas);
    if (body.requiredSkills !== undefined) updateData.requiredSkills = safeParseArray(body.requiredSkills);
    if (body.technologySuggestions !== undefined) updateData.technologySuggestions = safeParseArray(body.technologySuggestions);
    if (body.constraints !== undefined) updateData.constraints = body.constraints;
    if (body.eligibility !== undefined) updateData.eligibility = body.eligibility;
    if (body.teamSizeMin !== undefined) updateData.teamSizeMin = Number(body.teamSizeMin);
    if (body.teamSizeMax !== undefined) updateData.teamSizeMax = Number(body.teamSizeMax);
    if (body.submissionRequirements !== undefined) updateData.submissionRequirements = body.submissionRequirements;
    if (body.evaluationCriteria !== undefined) {
      updateData.evaluationCriteria = Array.isArray(body.evaluationCriteria) && body.evaluationCriteria.length > 0
        ? body.evaluationCriteria
        : DEFAULT_EVALUATION_CRITERIA;
    }
    if (body.status !== undefined) updateData.status = String(body.status).toUpperCase();
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? toISOStringSafe(body.deadline) : "";
    if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl;
    if (body.sourceName !== undefined) updateData.sourceName = body.sourceName;
    if (body.verificationStatus !== undefined) updateData.verificationStatus = body.verificationStatus;

    updateData.updatedAt = new Date().toISOString();

    const cleanedUpdate = removeUndefinedValues(updateData);
    await adminDb.collection("problemStatements").doc(found.id).set(cleanedUpdate, { merge: true });

    // Verify update
    const verifySnap = await adminDb.collection("problemStatements").doc(found.id).get();
    const updated = formatProblemStatementDoc(found.id, verifySnap.data());

    return NextResponse.json({
      success: true,
      message: "Problem statement updated successfully.",
      statement: updated,
      problemStatement: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/problem-statements/[id] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update problem statement" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  return PATCH(req, context);
}

/**
 * DELETE /api/problem-statements/[id]
 * Protected: Admin only
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database configuration error." }, { status: 500 });
    }

    const found = await findDocByIdOrSlug(adminDb, params.id);
    if (found) {
      await adminDb.collection("problemStatements").doc(found.id).delete();
    }

    return NextResponse.json({
      success: true,
      message: "Problem statement deleted successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/problem-statements/[id] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete problem statement" }, { status: 500 });
  }
}

