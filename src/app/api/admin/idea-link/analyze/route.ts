import { NextRequest, NextResponse } from "next/server";
import { getIdeaById, saveAiAnalysisToIdea } from "@/lib/idea-link-service";
import { analyzeIdeaWithGemini } from "@/lib/idea-link-gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ideaId } = body;

    if (!ideaId) {
      return NextResponse.json({ error: "ideaId is required" }, { status: 400 });
    }

    const idea = await getIdeaById(ideaId);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (idea.status !== "APPROVED" && idea.status !== "AI_ANALYZED" && idea.status !== "MATCHES_SHARED") {
      return NextResponse.json(
        { error: "Idea must be explicitly approved by Admin before running Gemini AI analysis." },
        { status: 400 }
      );
    }

    const aiResult = await analyzeIdeaWithGemini(idea);

    const savedIdea = await saveAiAnalysisToIdea(ideaId, {
      summary: aiResult.summary,
      targetMarketInsights: aiResult.targetMarketInsights,
      businessPotentialScore: aiResult.businessPotentialScore,
      suggestedCompanyCategories: aiResult.suggestedCompanyCategories,
      generatedMatches: aiResult.generatedMatches,
      model: aiResult.model,
    });

    return NextResponse.json({
      success: true,
      message: `Gemini AI analysis completed with ${aiResult.generatedMatches.length} real-world company matches.`,
      idea: savedIdea,
      aiAnalysis: savedIdea.aiAnalysis,
    });
  } catch (err: any) {
    console.error("POST /api/admin/idea-link/analyze error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze idea with Gemini" }, { status: 500 });
  }
}
