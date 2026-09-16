import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_EVALUATION_CRITERIA } from "@/lib/problem-statements";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

class GeminiRequestError extends Error {
  constructor(
    public readonly category: string,
    public readonly upstreamStatus: number,
  ) {
    super("Gemini API request failed");
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function categoryForStatus(status: number): string {
  if (status === 401 || status === 403) return "GEMINI_AUTH_ERROR";
  if (status === 400) return "GEMINI_REQUEST_ERROR";
  if (status === 404) return "GEMINI_MODEL_NOT_FOUND";
  if (status === 429) return "GEMINI_RATE_LIMIT";
  if (status >= 500) return "GEMINI_UPSTREAM_ERROR";
  return "GEMINI_API_ERROR";
}

function parseGeneratedProblem(text: string): Record<string, any> {
  const cleanText = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    throw new GeminiRequestError("GEMINI_MALFORMED_RESPONSE", 502);
  }

  const requiredStringFields = [
    "title", "shortDescription", "background", "fullProblemDescription",
    "existingChallenges", "targetUsers", "expectedOutcome", "constraints",
    "eligibility", "submissionRequirements", "domain", "difficulty",
    "organization", "organizationType", "location", "verificationStatus",
  ];
  const missingField = requiredStringFields.find((field) => typeof parsed?.[field] !== "string" || !parsed[field].trim());
  if (missingField || !Array.isArray(parsed?.proposedSolutionAreas) ||
      !Array.isArray(parsed?.requiredSkills) || !Array.isArray(parsed?.technologySuggestions) ||
      !Number.isInteger(parsed?.teamSizeMin) || !Number.isInteger(parsed?.teamSizeMax)) {
    throw new GeminiRequestError("GEMINI_MALFORMED_RESPONSE", 502);
  }

  return parsed;
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<{ problem: Record<string, any>; durationMs: number }> {
  const startedAt = Date.now();
  let lastError: GeminiRequestError | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });
    const responseText = await response.text();
    let responseData: any = null;
    try {
      responseData = JSON.parse(responseText);
    } catch {}

    if (response.ok) {
      const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof generatedText !== "string" || !generatedText.trim()) {
        throw new GeminiRequestError("GEMINI_MALFORMED_RESPONSE", 502);
      }
      return { problem: parseGeneratedProblem(generatedText), durationMs: Date.now() - startedAt };
    }

    const category = categoryForStatus(response.status);
    console.error("[GeminiProblemStatement] upstream failure", {
      configured: true,
      model: GEMINI_MODEL,
      status: response.status,
      category,
      message: typeof responseData?.error?.message === "string" ? responseData.error.message.slice(0, 300) : "No provider message",
      durationMs: Date.now() - startedAt,
      attempt: attempt + 1,
    });
    lastError = new GeminiRequestError(category, response.status);
    if (!isRetryableStatus(response.status) || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  throw lastError || new GeminiRequestError("GEMINI_API_ERROR", 502);
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { 
      domain, 
      industry, 
      topic, 
      targetUsers, 
      difficulty, 
      location, 
      requiredTech, 
      organization, 
      additionalRequirements 
    } = body;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[GeminiProblemStatement] missing configuration", {
        configured: false,
        model: GEMINI_MODEL,
      });
      return NextResponse.json(
        { success: false, error: "Gemini API is not configured", code: "GEMINI_CONFIG_ERROR" },
        { status: 503 }
      );
    }

    const prompt = `
You are an expert Problem Statement Architect for SC TECH (a premier career & technology platform).
Design an authentic, high-impact, real-world technology challenge based on the following input:

Domain: ${domain || "Software Engineering"}
Industry / Sector: ${industry || "Technology"}
Problem Topic: ${topic || "Distributed Cloud Architecture"}
Target Users: ${targetUsers || "Software engineers, enterprises, citizens"}
Difficulty: ${difficulty || "MEDIUM"}
Location / Context: ${location || "India"}
Required Technologies: ${requiredTech || "React, Node.js, Python, Cloud"}
Organization: ${organization || "SC TECH Original Challenge"}
Additional Requirements: ${additionalRequirements || "Must be scalable and production-ready"}

CRITICAL RULES:
1. Do NOT invent a fake government ministry, fake SIH problem number, or fake statistics.
2. If organization is not a verified real entity, set organizationType to "SC_TECH_ORIGINAL" and verificationStatus to "SC_TECH_ORIGINAL".
3. Return a SINGLE, VALID JSON OBJECT with the following schema:
{
  "title": "string (Compelling, action-oriented title)",
  "shortDescription": "string (2-3 concise summary sentences)",
  "background": "string (Context and industry status quo)",
  "fullProblemDescription": "string (Deep technical & operational problem statement breakdown)",
  "existingChallenges": "string (Key obstacles and inefficiencies)",
  "targetUsers": "string (Specific personas and stakeholders)",
  "expectedOutcome": "string (Concrete deliverable, key metrics, and benchmark targets)",
  "proposedSolutionAreas": ["string", "string"],
  "requiredSkills": ["string", "string"],
  "technologySuggestions": ["string", "string"],
  "constraints": "string (Latency, privacy, compliance, bandwidth or architectural constraints)",
  "eligibility": "Open to all engineering students, developers, and tech builders.",
  "teamSizeMin": 1,
  "teamSizeMax": 4,
  "submissionRequirements": "Working prototype GitHub repository, live demo URL, architecture diagram, and a 3-minute video walkthrough.",
  "domain": "${domain || "Software Engineering"}",
  "difficulty": "${difficulty || "MEDIUM"}",
  "organization": "${organization || "SC TECH Original Challenge"}",
  "organizationType": "SC_TECH_ORIGINAL",
  "location": "${location || "India / Global"}",
  "verificationStatus": "SC_TECH_ORIGINAL"
}
`;

    const generated = await generateWithGemini(prompt, apiKey);
    const generatedProblem = generated.problem;
    console.info("[GeminiProblemStatement] generation succeeded", {
      configured: true,
      model: GEMINI_MODEL,
      status: 200,
      durationMs: generated.durationMs,
    });

    // Add evaluation criteria & metadata
    generatedProblem.evaluationCriteria = DEFAULT_EVALUATION_CRITERIA;
    generatedProblem.isAiGenerated = true;
    generatedProblem.status = "DRAFT";

    // Safe audit logging
    try {
      if (session?.userId) {
        const adminDb = getAdminDb();
        if (adminDb) {
          await adminDb.collection("auditLogs").add({
            actorId: session.userId,
            actorRole: session.role || "ADMIN",
            action: "GEMINI_AI_PROBLEM_STATEMENT_GENERATED",
            entity: "ProblemStatement",
            entityId: generatedProblem.title || "ai-gen",
            details: JSON.stringify({
              input: body,
              outputTitle: generatedProblem.title,
              model: GEMINI_MODEL,
            }),
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({
      success: true,
      problem: generatedProblem,
    });
  } catch (error: any) {
    console.error("Error in AI Problem Statement Generator:", error);
    if (error instanceof GeminiRequestError) {
      return NextResponse.json(
        { success: false, error: "Gemini API request failed", code: error.category },
        { status: error.upstreamStatus >= 400 && error.upstreamStatus < 600 ? error.upstreamStatus : 502 }
      );
    }
    return NextResponse.json({ success: false, error: "Gemini generation failed", code: "GEMINI_INTERNAL_ERROR" }, { status: 500 });
  }
}

