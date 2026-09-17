import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_EVALUATION_CRITERIA, EvaluationCriterion } from "@/lib/problem-statements";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

class GeminiRequestError extends Error {
  constructor(
    public readonly category: string,
    public readonly upstreamStatus: number,
    message?: string
  ) {
    super(message || "Gemini API request failed");
  }
}

function parseGeneratedProblem(text: string): Record<string, any> {
  const cleanText = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    throw new GeminiRequestError("GEMINI_MALFORMED_RESPONSE", 502, "Gemini generated invalid JSON");
  }

  const title = typeof parsed?.title === "string" ? parsed.title.trim() : "";
  const description = typeof parsed?.description === "string" 
    ? parsed.description.trim() 
    : (typeof parsed?.shortDescription === "string" ? parsed.shortDescription.trim() : "");
  
  if (!title || !description) {
    throw new GeminiRequestError("GEMINI_MALFORMED_RESPONSE", 502, "Missing title or description in Gemini response");
  }

  // Ensure array fields
  const safeArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof val === "string") return val.split("\n").map((s) => s.trim()).filter(Boolean);
    return [];
  };

  let evalCriteria: EvaluationCriterion[] = DEFAULT_EVALUATION_CRITERIA;
  if (Array.isArray(parsed.evaluationCriteria) && parsed.evaluationCriteria.length > 0) {
    evalCriteria = parsed.evaluationCriteria.map((c: any) => ({
      category: String(c.category || "General").trim(),
      maxMarks: Number(c.maxMarks || c.marks || 20),
      description: String(c.description || "").trim(),
    }));
  }

  return {
    title,
    problemCode: typeof parsed.problemCode === "string" ? parsed.problemCode.trim() : "PS-01",
    category: typeof parsed.category === "string" ? parsed.category.trim() : (parsed.domain || "Technology & AI"),
    domain: typeof parsed.domain === "string" ? parsed.domain.trim() : "Software Engineering",
    difficulty: ["EASY", "MEDIUM", "HARD"].includes(String(parsed.difficulty).toUpperCase())
      ? String(parsed.difficulty).toUpperCase()
      : "MEDIUM",
    description,
    shortDescription: description,
    fullProblemDescription: typeof parsed.fullProblemDescription === "string" ? parsed.fullProblemDescription.trim() : description,
    background: typeof parsed.background === "string" ? parsed.background.trim() : "",
    targetUsers: typeof parsed.targetUsers === "string" ? parsed.targetUsers.trim() : "Students, developers, and industry professionals",
    objectives: safeArray(parsed.objectives),
    requirements: safeArray(parsed.requirements),
    proposedSolutionAreas: safeArray(parsed.proposedSolutionAreas || parsed.requirements),
    requiredSkills: safeArray(parsed.requiredSkills || parsed.skills),
    technologySuggestions: safeArray(parsed.technologySuggestions || parsed.techStack),
    constraints: typeof parsed.constraints === "string" ? parsed.constraints.trim() : "Must be functional, scalable, and secure.",
    expectedSolution: typeof parsed.expectedSolution === "string" ? parsed.expectedSolution.trim() : (parsed.expectedOutcome || "Working full-stack prototype with live demonstration."),
    submissionRequirements: typeof parsed.submissionRequirements === "string" ? parsed.submissionRequirements.trim() : "GitHub repository + Live deployment URL + Architecture documentation",
    evaluationCriteria: evalCriteria,
    resources: safeArray(parsed.resources),
    suggestedDeliverables: typeof parsed.suggestedDeliverables === "string" ? parsed.suggestedDeliverables.trim() : "1. Clean Git Repository\n2. Live Deployment URL\n3. Architecture Diagram",
    status: "DRAFT",
    isAiGenerated: true,
  };
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<Record<string, any>> {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.25,
            topP: 0.95,
          },
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof generatedText === "string" && generatedText.trim()) {
          return parseGeneratedProblem(generatedText);
        }
      } else {
        const errorText = await response.text();
        console.warn(`Gemini model ${model} returned status ${response.status}:`, errorText.slice(0, 200));
        lastError = new GeminiRequestError("GEMINI_API_ERROR", response.status, `Gemini API returned ${response.status}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new GeminiRequestError("GEMINI_UNAVAILABLE", 503, "All Gemini models failed");
}

export async function POST(req: Request) {
  try {
    // Strict Admin Authorization (Student / Non-Admin -> 403 Forbidden)
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      topic,
      hackathonId,
      hackathonTitle,
      domain,
      difficulty,
      targetUsers,
      constraints,
      customPrompt,
      displayOrder,
    } = body;

    if (!topic || !String(topic).trim()) {
      return NextResponse.json(
        { success: false, error: "Problem topic or concept is required for AI generation." },
        { status: 400 }
      );
    }

    const prompt = `
You are the official SC TECH Lead Technical Hackathon Architect.
Create a high-quality, authentic, industry-level hackathon problem statement based ONLY on this topic.

Hackathon Context: ${hackathonTitle || hackathonId || "SC TECH National Innovation Challenge"}
Topic / Concept: "${String(topic).trim()}"
Preferred Domain / Category: ${domain || "Software & Cloud Engineering"}
Target Users: ${targetUsers || "General users, enterprises, students"}
Difficulty: ${difficulty || "MEDIUM"}
Specific Constraints: ${constraints || "Modern scalable web/cloud architecture"}
${customPrompt ? `Additional Admin Instructions: "${customPrompt}"` : ""}

CRITICAL RULES:
1. Do NOT invent fake government partnerships, fake company sponsorships, or fake statistics.
2. Return a SINGLE, VALID JSON OBJECT matching this exact schema:
{
  "title": "string (Compelling, clear, industry-grade problem title)",
  "problemCode": "string (e.g. PS-01, AI-SEC-01)",
  "category": "string (e.g. Healthcare, EdTech, FinTech, Cybersecurity, AI/ML)",
  "domain": "string (e.g. Web & Cloud Engineering, Artificial Intelligence)",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "description": "string (Concise executive overview of the challenge)",
  "background": "string (Real-world context, pain points, and current status quo)",
  "targetUsers": "string (Target personas, end-users, or impacted stakeholders)",
  "objectives": [
    "string (Clear milestone 1)",
    "string (Clear milestone 2)",
    "string (Clear milestone 3)"
  ],
  "requirements": [
    "string (Functional & Technical requirement 1)",
    "string (Functional & Technical requirement 2)",
    "string (Functional & Technical requirement 3)"
  ],
  "constraints": "string (Latency, throughput, privacy, compliance, budget, or architectural constraints)",
  "expectedSolution": "string (Concrete definition of the working prototype and deliverables)",
  "requiredSkills": ["string", "string", "string"],
  "technologySuggestions": ["string", "string", "string"],
  "evaluationCriteria": [
    { "category": "Problem Understanding & Architecture", "maxMarks": 20, "description": "Clarity of solution design" },
    { "category": "Technical Implementation & Code Quality", "maxMarks": 30, "description": "Completeness and robustness" },
    { "category": "Innovation & Practical Impact", "maxMarks": 25, "description": "Novelty and feasibility" },
    { "category": "UI/UX & Deliverable Presentation", "maxMarks": 25, "description": "Demo usability and documentation" }
  ],
  "suggestedDeliverables": "string (1. GitHub repository with source code\\n2. Live web deployment\\n3. Demo video & architecture brief)",
  "resources": ["string (Helpful docs, APIs, or open datasets)"]
}
`;

    const generatedProblem = await generateWithGemini(prompt, apiKey);

    // Attach hackathon association and metadata
    generatedProblem.hackathonId = hackathonId || null;
    generatedProblem.hackathonTitle = hackathonTitle || undefined;
    generatedProblem.displayOrder = Number(displayOrder) || 1;
    generatedProblem.status = "DRAFT";
    generatedProblem.createdBy = session?.userId || "ADMIN";

    // Store in audit collection adminAiGenerations
    try {
      const adminDb = getAdminDb();
      if (adminDb && session?.userId) {
        await adminDb.collection("adminAiGenerations").add({
          adminUid: session.userId,
          adminEmail: session.email || "",
          type: "PROBLEM_STATEMENT_CREATE",
          hackathonId: hackathonId || null,
          topic: String(topic).trim(),
          prompt,
          generatedContent: generatedProblem,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (auditErr) {
      console.warn("Notice: Audit log write error:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Problem statement draft successfully generated with Gemini AI.",
      problem: generatedProblem,
    });
  } catch (error: any) {
    console.error("POST /api/admin/ai/problem-statements/generate Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate problem statement with Gemini AI." },
      { status: 500 }
    );
  }
}
