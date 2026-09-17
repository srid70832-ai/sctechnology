import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_EVALUATION_CRITERIA } from "@/lib/problem-statements";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

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
      existingProblem,
      action = "ENHANCE", // "ENHANCE" | "REWRITE" | "ADD_CONSTRAINTS" | "ADD_EVALUATION" | "CREATE_VARIATIONS"
      instructions,
      hackathonTitle,
    } = body;

    if (!existingProblem || !existingProblem.title) {
      return NextResponse.json(
        { success: false, error: "Existing problem statement data is required for enhancement." },
        { status: 400 }
      );
    }

    const prompt = `
You are the official SC TECH Lead Hackathon Architect.
Your task is to ENHANCE the following hackathon problem statement while STRICTLY PRESERVING the Admin's core vision and intent.

Enhancement Mode: ${action}
${instructions ? `Admin Specific Instructions: "${instructions}"` : ""}
Hackathon Context: ${hackathonTitle || existingProblem.hackathonTitle || "SC TECH National Innovation Challenge"}

Existing Problem Statement Draft:
${JSON.stringify(existingProblem, null, 2)}

Enhancement Guidelines:
1. Improve technical clarity, precision, and architectural depth.
2. Sharpen objectives, functional requirements, and concrete evaluation benchmarks.
3. Make constraints realistic and quantifiable (e.g. latency targets, privacy, concurrent load).
4. Preserve the core domain and problem focus.
5. Return a SINGLE, VALID JSON OBJECT matching this exact schema:
{
  "title": "string",
  "problemCode": "string",
  "category": "string",
  "domain": "string",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "description": "string",
  "background": "string",
  "targetUsers": "string",
  "objectives": ["string", "string", "string"],
  "requirements": ["string", "string", "string"],
  "constraints": "string",
  "expectedSolution": "string",
  "requiredSkills": ["string", "string", "string"],
  "technologySuggestions": ["string", "string", "string"],
  "evaluationCriteria": [
    { "category": "string", "maxMarks": 20, "description": "string" }
  ],
  "suggestedDeliverables": "string",
  "resources": ["string"]
}
`;

    let enhancedProblem: any = null;
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
            },
          }),
        });

        if (response.ok) {
          const responseData = await response.json();
          const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            const cleanText = generatedText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
            enhancedProblem = JSON.parse(cleanText);
            break;
          }
        } else {
          lastError = new Error(`Gemini ${model} HTTP ${response.status}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!enhancedProblem) {
      throw lastError || new Error("Failed to enhance problem statement with Gemini AI.");
    }

    // Preserve existing IDs and status
    enhancedProblem.id = existingProblem.id || undefined;
    enhancedProblem.hackathonId = existingProblem.hackathonId || null;
    enhancedProblem.displayOrder = existingProblem.displayOrder || 1;
    enhancedProblem.status = existingProblem.status || "DRAFT";
    enhancedProblem.isAiGenerated = true;

    // Log to admin audit collection
    try {
      const adminDb = getAdminDb();
      if (adminDb && session?.userId) {
        await adminDb.collection("adminAiGenerations").add({
          adminUid: session.userId,
          adminEmail: session.email || "",
          type: "PROBLEM_STATEMENT_ENHANCE",
          hackathonId: existingProblem.hackathonId || null,
          action,
          prompt,
          originalTitle: existingProblem.title,
          enhancedTitle: enhancedProblem.title,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Problem statement enhanced successfully with Gemini AI.",
      enhancedProblem,
      originalProblem: existingProblem,
    });
  } catch (error: any) {
    console.error("POST /api/admin/ai/problem-statements/enhance Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to enhance problem statement." },
      { status: 500 }
    );
  }
}
