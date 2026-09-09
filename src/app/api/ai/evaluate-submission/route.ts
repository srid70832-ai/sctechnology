import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const textPart = candidate?.content?.parts?.find((p: any) => typeof p.text === "string");
        if (textPart?.text) {
          return textPart.text;
        }
      } else {
        const errText = await res.text();
        console.warn(`Gemini evaluation ${model} HTTP ${res.status}:`, errText.slice(0, 150));
        lastError = new Error(`Gemini ${model} HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Gemini evaluation model calls failed");
}

export async function POST(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      submissionId,
      projectName,
      description,
      githubUrl,
      liveUrl,
      demoVideoUrl,
      techStack,
      targetTitle,
      problemStatement,
      roundNumber,
    } = body;

    if (!projectName || !githubUrl) {
      return NextResponse.json(
        { error: "projectName and githubUrl are required for AI evaluation." },
        { status: 400 }
      );
    }

    const evaluationPrompt = `You are the SC TECH AI Evaluation Engine for hackathons and technical project submissions.
Analyze the following project submission and produce an objective, fair, and comprehensive assessment.

Project Details:
- Target Event / Track: ${targetTitle || "SC TECH Hackathon 2026"}
- Round: ${roundNumber ? `Round ${roundNumber}` : "Round 1"}
- Project Name: ${projectName}
- GitHub Repository: ${githubUrl}
- Live Demo: ${liveUrl || "Not provided"}
- Demo Video: ${demoVideoUrl || "Not provided"}
- Tech Stack: ${Array.isArray(techStack) ? techStack.join(", ") : techStack || "Not specified"}
- Problem Description / Solution Overview:
${description}

Official Problem Requirements & Evaluation Context:
${problemStatement || "Evaluate against standard software engineering excellence, architecture, completeness, and usability."}

Instructions:
1. Score each metric out of 100 based on the technical implementation, architecture, and alignment with the requirements.
2. Calculate a weighted overallScore out of 100.
3. For AI involvement, DO NOT provide a fake exact percentage. Instead, provide an 'aiAssistanceIndicator' strictly as one of:
   - "Low AI-assistance indicators"
   - "Moderate AI-assistance indicators"
   - "High AI-assistance indicators"
   Provide an 'aiAssistanceRationale' with technical reasons/evidence.
4. For recommendation, output strictly one of:
   - "SHORTLIST" (if overallScore >= 75)
   - "REVIEW_REQUIRED" (if 60 <= overallScore < 75)
   - "REJECT" (if overallScore < 60)
5. Return strictly valid JSON with these keys:
{
  "technicalQualityScore": number,
  "problemUnderstandingScore": number,
  "innovationScore": number,
  "completenessScore": number,
  "documentationScore": number,
  "requirementComplianceScore": number,
  "overallScore": number,
  "aiAssistanceIndicator": "Low AI-assistance indicators" | "Moderate AI-assistance indicators" | "High AI-assistance indicators",
  "aiAssistanceRationale": string,
  "strengths": string[],
  "areasForImprovement": string[],
  "recommendation": "SHORTLIST" | "REVIEW_REQUIRED" | "REJECT",
  "feedbackSummary": string
}`;

    const rawJson = await callGemini(evaluationPrompt);
    let evaluationResult;
    try {
      evaluationResult = JSON.parse(rawJson);
    } catch {
      // Fallback clean parsing if code fences were included
      const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
      evaluationResult = JSON.parse(cleaned);
    }

    // Save evaluation result to Firestore submission if submissionId provided
    if (submissionId) {
      try {
        const subDocRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);
        await setDoc(
          subDocRef,
          removeUndefinedValues({
            aiEvaluation: {
              ...evaluationResult,
              evaluatedAt: new Date().toISOString(),
            },
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );
      } catch (saveErr) {
        console.warn("Notice saving AI evaluation to submission doc:", saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: evaluationResult,
    });
  } catch (error: any) {
    console.error("AI Evaluation Error:", error);
    return NextResponse.json(
      { error: error?.message || "AI Evaluation failed. Please try again." },
      { status: 500 }
    );
  }
}
