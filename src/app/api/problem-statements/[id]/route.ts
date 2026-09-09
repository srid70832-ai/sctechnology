import { NextResponse } from "next/server";
import { requireAdmin, getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { removeUndefinedValues } from "@/lib/firestore";
import { DEFAULT_EVALUATION_CRITERIA } from "@/lib/problem-statements";

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

/**
 * GET /api/problem-statements/[id]
 * Public / Student / Admin retrieval of a problem statement
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const p = await prisma.problemStatement.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
    });

    if (!p) {
      return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    }

    let evalCriteria = DEFAULT_EVALUATION_CRITERIA;
    try {
      if (p.evaluationCriteria) {
        evalCriteria = JSON.parse(p.evaluationCriteria);
      }
    } catch {}

    const statement = {
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

    return NextResponse.json({
      success: true,
      statement,
      problemStatement: statement,
    });
  } catch (error: any) {
    console.error("GET /api/problem-statements/[id] Error:", error);
    return NextResponse.json({ error: "Failed to fetch problem statement" }, { status: 500 });
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

    const body = await req.json();

    const existing = await prisma.problemStatement.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    }

    const toArray = (v: any): string[] => {
      if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
      if (typeof v === "string") return v.split("\n").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.shortDescription !== undefined) updateData.shortDescription = String(body.shortDescription).trim();
    if (body.fullProblemDescription !== undefined) updateData.fullProblemDescription = String(body.fullProblemDescription).trim();
    if (body.background !== undefined) updateData.background = body.background ? String(body.background).trim() : null;
    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty.toUpperCase();
    if (body.organization !== undefined) updateData.organization = body.organization;
    if (body.organizationType !== undefined) updateData.organizationType = body.organizationType;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.targetUsers !== undefined) updateData.targetUsers = body.targetUsers;
    if (body.existingChallenges !== undefined) updateData.existingChallenges = body.existingChallenges;
    if (body.expectedOutcome !== undefined) updateData.expectedOutcome = body.expectedOutcome;
    if (body.proposedSolutionAreas !== undefined) updateData.proposedSolutionAreas = JSON.stringify(toArray(body.proposedSolutionAreas));
    if (body.requiredSkills !== undefined) updateData.requiredSkills = JSON.stringify(toArray(body.requiredSkills));
    if (body.technologySuggestions !== undefined) updateData.technologySuggestions = JSON.stringify(toArray(body.technologySuggestions));
    if (body.constraints !== undefined) updateData.constraints = body.constraints;
    if (body.eligibility !== undefined) updateData.eligibility = body.eligibility;
    if (body.teamSizeMin !== undefined) updateData.teamSizeMin = Number(body.teamSizeMin);
    if (body.teamSizeMax !== undefined) updateData.teamSizeMax = Number(body.teamSizeMax);
    if (body.submissionRequirements !== undefined) updateData.submissionRequirements = body.submissionRequirements;
    if (body.evaluationCriteria !== undefined) updateData.evaluationCriteria = JSON.stringify(body.evaluationCriteria);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;

    const updated = await prisma.problemStatement.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Optional Firestore sync
    try {
      const docRef = doc(db, "problemStatements", existing.id);
      await setDoc(docRef, removeUndefinedValues({
        ...updateData,
        updatedAt: serverTimestamp(),
      }), { merge: true });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Problem statement updated successfully.",
      statement: updated,
      problemStatement: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/problem-statements/[id] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update problem statement" }, { status: 500 });
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

    await prisma.problemStatement.deleteMany({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
    });

    // Optional Firestore delete
    try {
      const docRef = doc(db, "problemStatements", params.id);
      await deleteDoc(docRef);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Problem statement deleted successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/problem-statements/[id] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete problem statement" }, { status: 500 });
  }
}

