import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_EVALUATION_CRITERIA } from "@/lib/problem-statements";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

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

    let generatedProblem: any = null;

    if (apiKey) {
      const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      for (const model of models) {
        if (generatedProblem) break;
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleanText = text.replace(/^```json/g, "").replace(/```$/g, "").trim();
              generatedProblem = JSON.parse(cleanText);
            }
          }
        } catch (geminiErr) {
          console.warn(`Gemini (${model}) API call note:`, geminiErr);
        }
      }
    }

    // Fallback if API key missing, rate-limited, or network issue
    if (!generatedProblem) {
      generatedProblem = {
        title: topic ? `Architecting ${topic} for Real-World Resilience` : "High-Throughput Distributed Platform Engineering",
        shortDescription: `Design and build an enterprise-grade solution addressing ${topic || "system bottlenecks"} with measurable efficiency and security.`,
        background: `Modern technology architectures in ${domain || "software engineering"} require resilient, fault-tolerant infrastructure capable of handling unpredictable traffic bursts.`,
        fullProblemDescription: `Participants are tasked with engineering an end-to-end working system that addresses key pain points in ${topic || "modern application delivery"}. The platform must emphasize zero-downtime operations, data integrity, and intuitive administrative observability.`,
        existingChallenges: "Legacy systems suffer from single points of failure, lack of real-time telemetry, and high latency under heavy concurrency.",
        targetUsers: targetUsers || "Enterprise developers, platform engineers, and system administrators.",
        expectedOutcome: "A fully functional, deployable prototype featuring automated test coverage, responsive client interfaces, and verifiable performance benchmarks.",
        proposedSolutionAreas: [
          "Microservices orchestration & automated failure recovery",
          "Real-time event streaming and telemetry dashboard",
          "Automated role-based access control and audit trails",
        ],
        requiredSkills: requiredTech ? requiredTech.split(",").map((s: string) => s.trim()) : ["React", "TypeScript", "Node.js", "Docker", "REST/GraphQL APIs"],
        technologySuggestions: ["Next.js", "Node.js / Go", "PostgreSQL / SQLite", "Docker", "Tailwind CSS"],
        constraints: "Prototype response latency must remain under 300ms for p95 requests. All data transmissions must be encrypted in transit.",
        eligibility: "Open to all students and developers.",
        teamSizeMin: 1,
        teamSizeMax: 4,
        submissionRequirements: "GitHub repo, live deployment link, demo video (3 mins max), architecture diagram.",
        domain: domain || "Software Engineering",
        difficulty: difficulty || "MEDIUM",
        organization: organization || "SC TECH Original Challenge",
        organizationType: "SC_TECH_ORIGINAL",
        location: location || "India / Global",
        verificationStatus: "SC_TECH_ORIGINAL",
      };
    }

    // Add evaluation criteria & metadata
    generatedProblem.evaluationCriteria = DEFAULT_EVALUATION_CRITERIA;
    generatedProblem.isAiGenerated = true;
    generatedProblem.status = "DRAFT";

    // Safe audit logging
    try {
      if (session?.userId) {
        await prisma.auditLog.create({
          data: {
            actorId: session.userId,
            actorRole: session.role || "ADMIN",
            action: "GEMINI_AI_PROBLEM_STATEMENT_GENERATED",
            entity: "ProblemStatement",
            entityId: generatedProblem.title || "ai-gen",
            details: JSON.stringify({
              input: body,
              outputTitle: generatedProblem.title,
              model: "Gemini 1.5 Flash",
            }),
          },
        });
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
    return NextResponse.json({ error: "Failed to generate problem statement with Gemini AI" }, { status: 500 });
  }
}

