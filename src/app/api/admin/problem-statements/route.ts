import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
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

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database configuration error." }, { status: 500 });
    }

    let queryRef: FirebaseFirestore.Query = adminDb.collection("problemStatements");

    if (statusParam && statusParam !== "ALL") {
      queryRef = queryRef.where("status", "==", statusParam.toUpperCase());
    }

    const snap = await queryRef.get();
    let list: ProblemStatement[] = [];
    snap.forEach((docSnap) => {
      list.push(formatProblemStatementDoc(docSnap.id, docSnap.data()));
    });

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      statements: list,
      problemStatements: list,
    });
  } catch (error: any) {
    console.error("Admin GET /api/admin/problem-statements Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch problem statements" }, { status: 500 });
  }
}
